import { Request, Response } from 'express';
import Invitation from '../models/Invitation';
import Repository from '../models/Repository';
import User from '../models/User';
import Notification from '../models/Notification';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Send invitations to a list of emails
export const inviteToRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const repoId = req.params.id;
    const senderId = (req as any).user.id;
    const { emails, role = 'Miembro', message } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      res.status(400).json({ message: 'Debe enviar al menos un correo' });
      return;
    }

    const repo = await Repository.findById(repoId);
    if (!repo) {
      res.status(404).json({ message: 'Repositorio no encontrado' });
      return;
    }

    // Only the owner can invite users
    if (repo.owner.toString() !== senderId) {
      res.status(403).json({ message: 'Solo el propietario puede invitar usuarios' });
      return;
    }

    // Find users by email
    const foundUsers = await User.find({ email: { $in: emails } });
    if (foundUsers.length !== emails.length) {
      const foundEmails = foundUsers.map((u) => u.email);
      const notFound = emails.filter((e: string) => !foundEmails.includes(e));
      res.status(400).json({ 
        message: 'Los siguientes correos no están registrados', 
        notFound 
      });
      return;
    }

    const createdInvitations: any[] = [];
    for (const u of foundUsers) {
      // Check if user is already a member
      if (repo.members.some((m: any) => m.equals(u._id))) {
        continue;
      }

      // Avoid duplicates: check for existing pending invitation
      const existing = await Invitation.findOne({ 
        repository: repoId, 
        recipient: u._id, 
        status: 'pending' 
      });
      if (existing) continue;

      const inv = new Invitation({
        repository: repoId,
        sender: new mongoose.Types.ObjectId(senderId),
        recipient: u._id,
        recipientEmail: u.email,
        role,
        message,
      });

      await inv.save();

      // Create notification for the recipient
      const notif = new Notification({
        user: u._id,
        type: 'invitation',
        title: 'Invitación a repositorio',
        message: message || `Has sido invitado al repositorio '${repo.name}' como ${role}`,
        meta: { 
          repository: repoId, 
          repositoryName: repo.name,
          invitation: inv._id,
          sender: senderId,
          role 
        },
      });
      await notif.save();

      createdInvitations.push({ invitation: inv, notification: notif });
    }

    res.status(201).json({ 
      message: 'Invitaciones enviadas', 
      created: createdInvitations.length 
    });
  } catch (error) {
    logger.error('Error inviteToRepository', error);
    res.status(500).json({ message: 'Error interno al enviar invitaciones' });
  }
};

// Get pending invitations for the authenticated user
export const getUserInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const invitations = await Invitation.find({ 
      recipient: userId,
      status: 'pending'
    })
      .sort({ createdAt: -1 })
      .populate('repository', 'name description privacy')
      .populate('sender', 'username email nombre apellido');

    res.status(200).json(invitations);
  } catch (error) {
    logger.error('Error getUserInvitations', error);
    res.status(500).json({ message: 'Error interno al obtener invitaciones' });
  }
};

// Get all invitations sent for a repository (for the owner)
export const getRepositoryInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    const repoId = req.params.id;
    const userId = (req as any).user.id;

    const repo = await Repository.findById(repoId);
    if (!repo) {
      res.status(404).json({ message: 'Repositorio no encontrado' });
      return;
    }

    if (repo.owner.toString() !== userId) {
      res.status(403).json({ message: 'No autorizado' });
      return;
    }

    const invitations = await Invitation.find({ repository: repoId })
      .sort({ createdAt: -1 })
      .populate('recipient', 'username email nombre apellido');

    res.status(200).json(invitations);
  } catch (error) {
    logger.error('Error getRepositoryInvitations', error);
    res.status(500).json({ message: 'Error interno al obtener invitaciones' });
  }
};

// Accept invitation
export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const invitationId = req.params.id;

    const inv = await Invitation.findById(invitationId).populate('repository');
    if (!inv) {
      res.status(404).json({ message: 'Invitación no encontrada' });
      return;
    }

    if (!inv.recipient || inv.recipient.toString() !== userId) {
      res.status(403).json({ message: 'No autorizado para aceptar esta invitación' });
      return;
    }

    if (inv.status !== 'pending') {
      res.status(400).json({ message: 'Invitación en estado no válido' });
      return;
    }

    inv.status = 'accepted';
    await inv.save();

    // Add member to the repository if not already there
    const repo: any = await Repository.findById(inv.repository._id);
    if (repo && !repo.members.some((m: any) => m.equals(inv.recipient))) {
      repo.members.push(inv.recipient);
      await repo.save();
    }

    // Notify the sender
    const notif = new Notification({
      user: inv.sender,
      type: 'invitationAccepted',
      title: 'Invitación aceptada',
      message: `El usuario ha aceptado la invitación al repositorio '${repo.name}'`,
      meta: { 
        repository: repo._id, 
        repositoryName: repo.name,
        invitation: inv._id, 
        user: inv.recipient 
      },
    });
    await notif.save();

    res.status(200).json({ message: 'Invitación aceptada', repository: repo });
  } catch (error) {
    logger.error('Error acceptInvitation', error);
    res.status(500).json({ message: 'Error interno al aceptar invitación' });
  }
};

// Reject invitation
export const rejectInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const invitationId = req.params.id;

    const inv = await Invitation.findById(invitationId);
    if (!inv) {
      res.status(404).json({ message: 'Invitación no encontrada' });
      return;
    }

    if (!inv.recipient || inv.recipient.toString() !== userId) {
      res.status(403).json({ message: 'No autorizado para rechazar esta invitación' });
      return;
    }

    if (inv.status !== 'pending') {
      res.status(400).json({ message: 'Invitación en estado no válido' });
      return;
    }

    inv.status = 'rejected';
    await inv.save();

    // Notify the sender
    const repo: any = await Repository.findById(inv.repository);
    const notif = new Notification({
      user: inv.sender,
      type: 'invitationRejected',
      title: 'Invitación rechazada',
      message: `El usuario ha rechazado la invitación al repositorio '${repo?.name || ''}'`,
      meta: { 
        repository: inv.repository, 
        repositoryName: repo?.name,
        invitation: inv._id, 
        user: inv.recipient 
      },
    });
    await notif.save();

    res.status(200).json({ message: 'Invitación rechazada' });
  } catch (error) {
    logger.error('Error rejectInvitation', error);
    res.status(500).json({ message: 'Error interno al rechazar invitación' });
  }
};

// Cancel invitation (by sender)
export const cancelInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const invitationId = req.params.id;

    const inv = await Invitation.findById(invitationId);
    if (!inv) {
      res.status(404).json({ message: 'Invitación no encontrada' });
      return;
    }

    if (inv.sender.toString() !== userId) {
      res.status(403).json({ message: 'No autorizado para cancelar esta invitación' });
      return;
    }

    if (inv.status !== 'pending') {
      res.status(400).json({ message: 'Solo se pueden cancelar invitaciones pendientes' });
      return;
    }

    inv.status = 'cancelled';
    await inv.save();

    res.status(200).json({ message: 'Invitación cancelada' });
  } catch (error) {
    logger.error('Error cancelInvitation', error);
    res.status(500).json({ message: 'Error interno al cancelar invitación' });
  }
};

// Get notifications for the authenticated user
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const notifs = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to recent 50 notifications
    res.status(200).json(notifs);
  } catch (error) {
    logger.error('Error getNotifications', error);
    res.status(500).json({ message: 'Error interno al obtener notificaciones' });
  }
};

// Mark notification as read
export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const notifId = req.params.id;
    
    const notif = await Notification.findById(notifId);
    if (!notif) {
      res.status(404).json({ message: 'Notificación no encontrada' });
      return;
    }
    
    if (notif.user.toString() !== userId) {
      res.status(403).json({ message: 'No autorizado' });
      return;
    }
    
    notif.read = true;
    await notif.save();
    
    res.status(200).json({ message: 'Marcada como leída' });
  } catch (error) {
    logger.error('Error markNotificationRead', error);
    res.status(500).json({ message: 'Error interno al marcar notificación' });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );
    
    res.status(200).json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    logger.error('Error markAllNotificationsRead', error);
    res.status(500).json({ message: 'Error interno' });
  }
};

// Get repository members
export const getRepositoryMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const repoId = req.params.id;
    const userId = (req as any).user.id;

    const repo = await Repository.findById(repoId)
      .populate('owner', 'username email nombre apellido profileImage')
      .populate('members', 'username email nombre apellido profileImage');

    if (!repo) {
      res.status(404).json({ message: 'Repositorio no encontrado' });
      return;
    }

    // Check if user has access to this repository
    const isMember = repo.members.some((m: any) => m._id.equals(userId));
    const isOwner = repo.owner._id.equals(userId);

    if (!isMember && !isOwner) {
      res.status(403).json({ message: 'No tienes acceso a este repositorio' });
      return;
    }

    res.status(200).json({
      owner: repo.owner,
      members: repo.members,
    });
  } catch (error) {
    logger.error('Error getRepositoryMembers', error);
    res.status(500).json({ message: 'Error interno al obtener miembros' });
  }
};

// Remove member from repository
export const removeMemberFromRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const repoId = req.params.id;
    const userId = (req as any).user.id;
    const { memberId } = req.body;

    if (!memberId) {
      res.status(400).json({ message: 'Se requiere el ID del miembro' });
      return;
    }

    const repo = await Repository.findById(repoId);
    if (!repo) {
      res.status(404).json({ message: 'Repositorio no encontrado' });
      return;
    }

    // Only the owner can remove members
    if (repo.owner.toString() !== userId) {
      res.status(403).json({ message: 'Solo el propietario puede eliminar miembros' });
      return;
    }

    // Cannot remove the owner
    if (repo.owner.toString() === memberId) {
      res.status(400).json({ message: 'No se puede eliminar al propietario' });
      return;
    }

    // Remove member from the repository
    repo.members = repo.members.filter((m: any) => m.toString() !== memberId);
    await repo.save();

    // Notify the removed member
    const notif = new Notification({
      user: new mongoose.Types.ObjectId(memberId),
      type: 'memberRemoved',
      title: 'Removido de repositorio',
      message: `Has sido removido del repositorio '${repo.name}'`,
      meta: { 
        repository: repo._id, 
        repositoryName: repo.name 
      },
    });
    await notif.save();

    res.status(200).json({ message: 'Miembro eliminado correctamente' });
  } catch (error) {
    logger.error('Error removeMemberFromRepository', error);
    res.status(500).json({ message: 'Error interno al eliminar miembro' });
  }
};
