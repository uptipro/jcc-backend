import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;

  getPool(): Pool {
    if (!this.pool) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('Missing DATABASE_URL');
      }

      this.pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      this.pool.on('error', (err) => {
        this.logger.error('PostgreSQL pool error', err);
      });
    }
    return this.pool;
  }

  async onModuleInit(): Promise<void> {
    // Initialise the schema in the background so a transient DB outage
    // doesn't prevent the API from starting.
    try {
      await this.initDb();
      this.logger.log('PostgreSQL connected and schema ready');
    } catch (err) {
      this.logger.error('PostgreSQL init failed', err as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async initDb(): Promise<void> {
    const client = await this.getPool().connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS departments (
          id          TEXT PRIMARY KEY,
          name        TEXT NOT NULL,
          name_lower  TEXT NOT NULL UNIQUE,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS members (
          id               TEXT PRIMARY KEY,
          personal_details JSONB NOT NULL,
          church_details   JSONB NOT NULL,
          created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS counters (
          key  TEXT PRIMARY KEY,
          seq  INTEGER NOT NULL DEFAULT 0
        );
      `);
    } finally {
      client.release();
    }
  }
}
