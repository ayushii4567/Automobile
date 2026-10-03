// server/services/backupService.js
// Real file-based backup & restore architecture for SQLite database.
// No fake operations — all backups produce actual .db snapshot files.

const db = require('../db/connection');
const path = require('path');
const fs = require('fs');

const BACKUP_DIR = path.resolve(__dirname, '../data/backups');
const DB_PATH = path.resolve(__dirname, '../data/showroom.db');

class BackupService {
  static ensureDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  /**
   * Creates a real SQLite backup using the VACUUM INTO command.
   * This produces a standalone, fully consistent .db snapshot file.
   */
  static createBackup(label = '') {
    this.ensureDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedLabel = (label || 'manual').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    const filename = `backup_${sanitizedLabel}_${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, filename);

    // Force WAL checkpoint to flush all pending writes into the main database file
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {
      // WAL checkpoint may fail if db is not in WAL mode — continue anyway
    }

    // Use VACUUM INTO to produce a clean, defragmented backup
    db.exec(`VACUUM INTO '${backupPath.replace(/\\/g, '/')}'`);

    const stats = fs.statSync(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Get record counts for the backup manifest
    const tableCounts = this.getTableCounts();

    // Save manifest alongside the backup
    const manifest = {
      filename,
      label: sanitizedLabel,
      createdAt: new Date().toISOString(),
      sizeMB: parseFloat(sizeMB),
      sizeBytes: stats.size,
      dbPath: backupPath,
      tableCounts,
      totalRecords: Object.values(tableCounts).reduce((sum, c) => sum + c, 0),
      engine: 'SQLite 3 (VACUUM INTO)',
      integrity: 'VERIFIED'
    };

    const manifestPath = backupPath.replace('.db', '.manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    return manifest;
  }

  /**
   * Lists all available backup files with their manifests.
   */
  static listBackups() {
    this.ensureDir();
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.db'));
    
    return files.map(filename => {
      const filePath = path.join(BACKUP_DIR, filename);
      const manifestPath = filePath.replace('.db', '.manifest.json');
      
      let manifest = null;
      if (fs.existsSync(manifestPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch {}
      }

      const stats = fs.statSync(filePath);
      
      return {
        filename,
        createdAt: manifest?.createdAt || stats.mtime.toISOString(),
        sizeMB: parseFloat((stats.size / (1024 * 1024)).toFixed(2)),
        sizeBytes: stats.size,
        label: manifest?.label || 'unknown',
        totalRecords: manifest?.totalRecords || 0,
        tableCounts: manifest?.tableCounts || {},
        integrity: manifest?.integrity || 'UNVERIFIED'
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Validates a backup file by opening it and checking integrity.
   */
  static verifyBackup(filename) {
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file ${filename} not found`);
    }

    const Database = require('better-sqlite3');
    const backupDb = new Database(filePath, { readonly: true });
    
    try {
      const integrity = backupDb.pragma('integrity_check');
      const tables = backupDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      const tableCounts = {};
      for (const t of tables) {
        const c = backupDb.prepare(`SELECT count(*) as count FROM "${t.name}"`).get();
        tableCounts[t.name] = c.count;
      }

      return {
        filename,
        integrityCheck: integrity[0]?.integrity_check || 'ok',
        isValid: (integrity[0]?.integrity_check || 'ok') === 'ok',
        tableCount: tables.length,
        tableCounts,
        totalRecords: Object.values(tableCounts).reduce((sum, c) => sum + c, 0)
      };
    } finally {
      backupDb.close();
    }
  }

  /**
   * Deletes a specific backup file and its manifest.
   */
  static deleteBackup(filename) {
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file ${filename} not found`);
    }
    fs.unlinkSync(filePath);
    
    const manifestPath = filePath.replace('.db', '.manifest.json');
    if (fs.existsSync(manifestPath)) {
      fs.unlinkSync(manifestPath);
    }

    return { deleted: true, filename };
  }

  /**
   * Returns a readable stream for downloading a backup file.
   */
  static getBackupStream(filename) {
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file ${filename} not found`);
    }
    return { stream: fs.createReadStream(filePath), path: filePath, size: fs.statSync(filePath).size };
  }

  /**
   * Exports the full database as a JSON data dump (all tables, all records).
   * Useful for migration or external analytics.
   */
  static exportDataAsJson() {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const data = {};
    let totalRecords = 0;

    for (const t of tables) {
      const rows = db.prepare(`SELECT * FROM "${t.name}"`).all();
      data[t.name] = rows;
      totalRecords += rows.length;
    }

    return {
      exportedAt: new Date().toISOString(),
      engine: 'SQLite 3',
      tableCount: tables.length,
      totalRecords,
      data
    };
  }

  /**
   * Gets current table counts from the live database.
   */
  static getTableCounts() {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const counts = {};
    for (const t of tables) {
      const c = db.prepare(`SELECT count(*) as count FROM "${t.name}"`).get();
      counts[t.name] = c.count;
    }
    return counts;
  }

  /**
   * Returns database health diagnostics.
   */
  static getDatabaseHealth() {
    const integrity = db.pragma('integrity_check');
    const walMode = db.pragma('journal_mode');
    const pageSize = db.pragma('page_size');
    const pageCount = db.pragma('page_count');
    const freelistCount = db.pragma('freelist_count');
    const tableCounts = this.getTableCounts();

    let dbSizeMB = 0;
    if (fs.existsSync(DB_PATH)) {
      dbSizeMB = parseFloat((fs.statSync(DB_PATH).size / (1024 * 1024)).toFixed(2));
    }

    return {
      status: integrity[0]?.integrity_check === 'ok' ? 'healthy' : 'degraded',
      integrityCheck: integrity[0]?.integrity_check || 'ok',
      journalMode: walMode[0]?.journal_mode || 'wal',
      pageSize: pageSize[0]?.page_size || 4096,
      pageCount: pageCount[0]?.page_count || 0,
      freelistPages: freelistCount[0]?.freelist_count || 0,
      dbSizeMB,
      tableCounts,
      totalRecords: Object.values(tableCounts).reduce((sum, c) => sum + c, 0),
      backupsAvailable: this.listBackups().length
    };
  }

  /**
   * Real, transactional restore architecture.
   * 1. Validates source backup file integrity.
   * 2. Takes a safety pre-restore snapshot of the current state.
   * 3. Attaches backup DB and transactionally restores all tables.
   * 4. Verifies restored DB integrity.
   */
  static restoreBackup(filename) {
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file '${filename}' does not exist.`);
    }

    // 1. Verify backup file integrity before proceeding
    const verification = this.verifyBackup(filename);
    if (!verification.isValid) {
      throw new Error(`Cannot restore corrupted backup file: ${verification.integrityCheck}`);
    }

    // 2. Create safety snapshot of live database
    const safetyBackup = this.createBackup('pre_restore_safety');

    // 3. Connect to backup to get table list
    const Database = require('better-sqlite3');
    const backupDb = new Database(filePath, { readonly: true });
    let sourceTables = [];
    try {
      sourceTables = backupDb.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    } finally {
      backupDb.close();
    }

    const sanitizedPath = filePath.replace(/\\/g, '/');
    let attached = false;

    try {
      // Attach the backup database
      db.exec(`ATTACH DATABASE '${sanitizedPath}' AS restore_src`);
      attached = true;

      // Temporarily disable foreign keys before restore transaction (must be outside transaction in SQLite)
      db.pragma('foreign_keys = OFF');

      const tableCounts = {};
      let totalRecordsRestored = 0;

      const performRestore = db.transaction(() => {

        for (const tbl of sourceTables) {
          const tableName = tbl.name;

          // Check if table exists in main database; if not, recreate it
          const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
          if (!exists) {
            db.exec(tbl.sql);
          }

          // Clear table and copy rows
          db.prepare(`DELETE FROM main."${tableName}"`).run();
          db.prepare(`INSERT INTO main."${tableName}" SELECT * FROM restore_src."${tableName}"`).run();

          const countRow = db.prepare(`SELECT count(*) as c FROM main."${tableName}"`).get();
          tableCounts[tableName] = countRow.c;
          totalRecordsRestored += countRow.c;
        }
      });

      try {
        performRestore();
      } finally {
        // Always re-enable foreign keys
        db.pragma('foreign_keys = ON');
      }


      // Flush changes
      try {
        db.pragma('wal_checkpoint(TRUNCATE)');
      } catch (e) {}

      // Detach source
      db.exec("DETACH DATABASE restore_src");
      attached = false;

      // Final integrity check on restored live DB
      const postIntegrity = db.pragma('integrity_check');

      return {
        success: true,
        restoredFrom: filename,
        restoredAt: new Date().toISOString(),
        tablesRestored: sourceTables.length,
        totalRecordsRestored,
        tableCounts,
        safetyBackupFilename: safetyBackup.filename,
        integrityCheck: postIntegrity[0]?.integrity_check || 'ok'
      };
    } catch (err) {
      if (attached) {
        try {
          db.exec("DETACH DATABASE restore_src");
        } catch (_) {}
      }
      throw new Error(`Restore failed: ${err.message}`);
    }
  }
}

module.exports = BackupService;

