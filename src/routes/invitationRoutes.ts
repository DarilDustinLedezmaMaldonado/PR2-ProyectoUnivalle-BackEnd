import express from 'express';
import { verifyToken } from '../middleware/auth';
import {
  inviteToRepository,
  getUserInvitations,
  getRepositoryInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getRepositoryMembers,
  removeMemberFromRepository,
} from '../controllers/invitationController';

const router = express.Router();

// Invitation routes
router.post('/repos/:id/invite', verifyToken, inviteToRepository);
router.get('/repos/:id/invitations', verifyToken, getRepositoryInvitations);
router.get('/invitations', verifyToken, getUserInvitations);
router.post('/invitations/:id/accept', verifyToken, acceptInvitation);
router.post('/invitations/:id/reject', verifyToken, rejectInvitation);
router.post('/invitations/:id/cancel', verifyToken, cancelInvitation);

// Notification routes
router.get('/notifications', verifyToken, getNotifications);
router.post('/notifications/:id/read', verifyToken, markNotificationRead);
router.post('/notifications/read-all', verifyToken, markAllNotificationsRead);

// Repository member management
router.get('/repos/:id/members', verifyToken, getRepositoryMembers);
router.post('/repos/:id/remove-member', verifyToken, removeMemberFromRepository);

export default router;
