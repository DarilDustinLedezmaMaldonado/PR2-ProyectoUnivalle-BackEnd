import mongoose from 'mongoose';
import { Db } from 'mongodb';

let db: Db;

export const getDb = (): Db => {
  if (!db) {
    db = mongoose.connection.db;
  }
  return db;
};
