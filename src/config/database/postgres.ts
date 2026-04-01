import { Pool } from '@neondatabase/serverless';
import config from '@config/index.js';
import logger from '@config/logger.js';

class PostgresConnection {
  private pool: Pool | null = null;

  private getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: config.postgres.url,
        max: 10,
      });

      this.pool.on('error', (err: Error): void => {
        logger.error('Unexpected error on Neon client', err);
      });

      logger.info('Neon Pool Created');
    }

    return this.pool;
  }

  async testConnection(): Promise<void> {
    try {
      const pool = this.getPool();
      const result = await pool.query('SELECT NOW()');
      logger.info(`Neon connected at ${result.rows[0].now}`);
    } catch (error) {
      logger.error('Failed to connect to Neon', error);
      throw error;
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<T> {
    const pool = this.getPool();
    const start = Date.now();

    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Executed query', {
        text,
        duration,
        rows: result.rowCount,
      });

      return result as T;
    } catch (error: any) {
      logger.error('Query error:', {
        text,
        error: error.message,
      });
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Neon pool closed!');
    }
  }
}

export default new PostgresConnection();
