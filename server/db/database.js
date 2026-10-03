/**
 * Apex Horizon Motors — Database Module
 * 
 * Provides unified access to the SQLite connection, migrations,
 * and automated database bootstrapping.
 */

const db = require('./connection');
const runMigrations = require('./migrate');
const seedDatabase = require('./seed');
const runVerification = require('./verify');

// Ensure tables exist; if fresh database, automatically migrate and seed
try {
  const tableCheck = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
  if (!tableCheck || tableCheck.count === 0) {
    console.log('⚡ [DB INIT] Fresh database detected. Running automated migration and initial seed...');
    runMigrations({ dropExisting: false });
    seedDatabase();
  }
  const applySchemaExtensions = require('./schema_extension');
  applySchemaExtensions();
  // Apply enhanced showroom settings columns (invoice/quotation/GST/bank fields)
  const settingsService = require('../services/settingsService');
  settingsService.applyExtensions();
} catch (err) {
  console.warn('⚠️ [DB INIT] Automatic check encountered error (will proceed with existing DB):', err.message);
}

module.exports = db;
module.exports.db = db;
module.exports.runMigrations = runMigrations;
module.exports.seedDatabase = seedDatabase;
module.exports.runVerification = runVerification;
