import {
  readdir,
  readFile,
} from 'node:fs/promises';

import {
  fileURLToPath,
} from 'node:url';

import {
  getDbPool,
} from './pool';

try {
  process.loadEnvFile('.env');
} catch {
  // Local development can use the Docker defaults without a .env file.
}

const migrationsDirectory =
  fileURLToPath(
    new URL(
      './migrations/',
      import.meta.url,
    ),
  );

const run = async (): Promise<void> => {
  const pool =
    getDbPool();

  const client =
    await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files =
      (
        await readdir(
          migrationsDirectory,
        )
      )
        .filter(
          (file) =>
            file.endsWith(
              '.sql',
            ),
        )
        .sort();

    for (const file of files) {
      const existing =
        await client.query<{
          name: string;
        }>(
          'SELECT name FROM schema_migrations WHERE name = $1',
          [file],
        );

      if (
        existing.rowCount &&
        existing.rowCount > 0
      ) {
        console.log(
          `Migration already applied: ${file}`,
        );

        continue;
      }

      const sql =
        await readFile(
          new URL(
            `./migrations/${file}`,
            import.meta.url,
          ),
          'utf8',
        );

      await client.query(
        'BEGIN',
      );

      try {
        await client.query(
          sql,
        );

        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [file],
        );

        await client.query(
          'COMMIT',
        );

        console.log(
          `Applied migration: ${file}`,
        );
      } catch (error) {
        await client.query(
          'ROLLBACK',
        );

        throw error;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch(
  (error) => {
    console.error(
      'Database migration failed',
      error,
    );

    process.exitCode = 1;
  },
);
