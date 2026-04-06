import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import fs from 'fs';
import path from 'path';

/**
 * Exports the full database schema as a SQL file.
 * Queries SQLite's sqlite_master table which stores the CREATE
 * statement for every table, index, and trigger in the database.
 */
async function exportSchema() {
  // Use a temp database so we don't disturb the dev database
  const schemaSource = AppDataSource.setOptions({
    database: './schema_temp.db',
    synchronize: true,
    logging: false,
  });

  await schemaSource.initialize();
  console.log('Schema database initialised.');

  // sqlite_master contains the SQL used to create every object
  const rows = await schemaSource.query(
    `SELECT type, name, sql
     FROM sqlite_master
     WHERE type IN ('table', 'index')
       AND name NOT LIKE 'sqlite_%'
       AND sql IS NOT NULL
     ORDER BY type DESC, name ASC`
  );

  const lines: string[] = [
    '-- ============================================================',
    '-- E-Commerce System — Database Schema',
    `-- Generated: ${new Date().toISOString()}`,
    '-- Database: SQLite (better-sqlite3)',
    '-- ============================================================',
    '',
  ];

  // Group by type for readability
  const tables = rows.filter((r: any) => r.type === 'table');
  const indexes = rows.filter((r: any) => r.type === 'index');

  if (tables.length > 0) {
    lines.push('-- ── TABLES ─────────────────────────────────────────────────');
    lines.push('');
    for (const row of tables) {
      lines.push(`-- Table: ${row.name}`);
      lines.push(row.sql + ';');
      lines.push('');
    }
  }

  if (indexes.length > 0) {
    lines.push('-- ── INDEXES ────────────────────────────────────────────────');
    lines.push('');
    for (const row of indexes) {
      lines.push(row.sql + ';');
    }
    lines.push('');
  }

  const outputPath = path.join(process.cwd(), 'schema.sql');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  console.log(`Schema exported to: ${outputPath}`);

  await schemaSource.destroy();

  // Clean up temp database
  const tempDb = path.join(process.cwd(), 'schema_temp.db');
  if (fs.existsSync(tempDb)) fs.unlinkSync(tempDb);
  console.log('Done.');
}

exportSchema().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});