const fs = require('fs');
const path = require('path');
const db = require('./connection');

function runMigrations(options = { dropExisting: false }) {
  console.log('🔄 [MIGRATION] Starting database migration for Apex Horizon Motors...');
  
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // If dropping existing is requested or needed to resolve schema discrepancies
  if (options.dropExisting) {
    console.log('🧹 [MIGRATION] Cleaning existing tables for fresh schema rebuild...');
    db.pragma('foreign_keys = OFF');
    const existingViews = db.prepare("SELECT name FROM sqlite_master WHERE type='view'").all();
    for (const v of existingViews) {
      db.exec(`DROP VIEW IF EXISTS "${v.name}"`);
    }
    const existingTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    for (const t of existingTables) {
      db.exec(`DROP TABLE IF EXISTS "${t.name}"`);
    }
    db.pragma('foreign_keys = ON');
  }

  db.transaction(() => {
    db.exec(schemaSql);
  })();

  // Verify foreign key integrity
  const fkErrors = db.prepare('PRAGMA foreign_key_check').all();
  if (fkErrors.length > 0) {
    console.error('❌ [MIGRATION] Foreign key integrity violations detected:', fkErrors);
    throw new Error('Foreign key integrity check failed!');
  }

  // Verify database integrity
  const integrity = db.prepare('PRAGMA integrity_check').get();
  if (integrity.integrity_check !== 'ok') {
    console.error('❌ [MIGRATION] Database integrity check failed:', integrity);
    throw new Error('Database integrity check failed!');
  }

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  console.log(`✅ [MIGRATION] Successfully created / verified ${tables.length} relational tables.`);
  
  return {
    success: true,
    tableCount: tables.length,
    tables: tables.map(t => t.name)
  };
}

if (require.main === module) {
  try {
    const res = runMigrations({ dropExisting: true });
    console.log('📋 All Created Relational Tables:');
    res.tables.forEach((t, i) => console.log(`   [${String(i + 1).padStart(2, '0')}] ${t}`));
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

module.exports = runMigrations;
