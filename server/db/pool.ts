import { Pool } from 'pg';

const DEFAULT_DATABASE_URL =
  'postgresql://backstop:backstop@localhost:5432/backstop';

let pool: Pool | null = null;

export const getDbPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ??
        DEFAULT_DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 4_000,
      idleTimeoutMillis: 30_000,
    });

    pool.on(
      'error',
      (error) => {
        console.error(
          'Unexpected PostgreSQL pool error',
          error,
        );
      },
    );
  }

  return pool;
};

export const checkDatabaseConnection =
  async (): Promise<boolean> => {
    try {
      await getDbPool().query(
        'SELECT 1',
      );

      return true;
    } catch {
      return false;
    }
  };
