import Database from 'better-sqlite3';
import { getDatabase } from '../db/connection.js';

export abstract class BaseRepository<T> {
  protected get db(): Database.Database {
    return getDatabase();
  }

  abstract findById(id: string): T | null;
  abstract findAll(): T[];
}
