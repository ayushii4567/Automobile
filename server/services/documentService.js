// server/services/documentService.js
// Document management service with real file storage.
// Stores files under server/data/documents/<entity_type>/<entity_id>/
// Metadata is stored in the `documents` SQLite table.

const db = require('../db/connection');
const path = require('path');
const fs = require('fs');

const DOCS_BASE_DIR = path.resolve(__dirname, '../data/documents');

class DocumentService {
  static ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  static normalizeDocType(docType) {
    if (!docType) return 'Form 20 / RTO Application';
    const allowed = [
      'Aadhaar', 'PAN Card', 'Driving License', 'Registration Certificate (RC)',
      'Insurance Policy Doc', 'Delivery Note', 'Invoice PDF', 'Form 20 / RTO Application'
    ];
    if (allowed.includes(docType)) return docType;

    const lower = String(docType).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (lower.includes('kyc') || lower.includes('aadhaar') || lower.includes('aadhar') || lower.includes('address')) return 'Aadhaar';
    if (lower.includes('pan')) return 'PAN Card';
    if (lower.includes('license') || lower.includes('dl')) return 'Driving License';
    if (lower.includes('insurance') || lower.includes('policy')) return 'Insurance Policy Doc';
    if (lower.includes('rc') || lower.includes('registration') || lower.includes('vehicledocs') || lower.includes('vehicle')) return 'Registration Certificate (RC)';
    if (lower.includes('delivery') || lower.includes('agreement') || lower.includes('contract')) return 'Delivery Note';
    if (lower.includes('invoice')) return 'Invoice PDF';
    return 'Form 20 / RTO Application';
  }

  /**
   * Upload a document file with metadata and entity linking.
   */
  static upload({ entityType, entityId, title, docType, fileBuffer, originalName, uploadedBy = null }) {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const dir = path.join(DOCS_BASE_DIR, entityType, entityId);
    this.ensureDir(dir);

    const ext = path.extname(originalName) || '';
    const safeFilename = `${id}${ext}`;
    const filePath = path.join(dir, safeFilename);
    fs.writeFileSync(filePath, fileBuffer);

    const fileUrl = `data/documents/${entityType}/${entityId}/${safeFilename}`;
    const fileSizeKb = Math.round(fileBuffer.length / 1024);
    const validDocType = this.normalizeDocType(docType);

    let validUploader = null;
    if (uploadedBy) {
      const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(uploadedBy);
      if (userExists) validUploader = uploadedBy;
    }

    db.prepare(`
      INSERT INTO documents (id, entity_type, entity_id, title, doc_type, file_url, file_size_kb, uploaded_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(id, entityType, entityId, title, validDocType, fileUrl, fileSizeKb, validUploader);

    return db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  }


  /**
   * List all documents for a given entity (customer, vehicle, sale, etc.)
   */
  static listByEntity(entityType, entityId) {
    return db.prepare(
      'SELECT * FROM documents WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC'
    ).all(entityType, entityId);
  }

  /**
   * List all documents across all entities, with optional filters.
   */
  static listAll({ entityType, docType, search } = {}) {
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params = [];

    if (entityType) {
      sql += ' AND entity_type = ?';
      params.push(entityType);
    }
    if (docType) {
      sql += ' AND doc_type = ?';
      params.push(docType);
    }
    if (search) {
      sql += ' AND (title LIKE ? OR doc_type LIKE ? OR entity_id LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY created_at DESC';
    return db.prepare(sql).all(...params);
  }

  /**
   * Get a single document by ID.
   */
  static getById(id) {
    return db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  }

  /**
   * Delete a document (both file and DB record).
   */
  static delete(id) {
    const doc = this.getById(id);
    if (!doc) return false;

    const absolutePath = path.resolve(__dirname, '..', doc.file_url);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    return true;
  }

  /**
   * Get readable stream + metadata for download.
   */
  static getDownloadInfo(id) {
    const doc = this.getById(id);
    if (!doc) throw new Error('Document not found');

    const absolutePath = path.resolve(__dirname, '..', doc.file_url);
    if (!fs.existsSync(absolutePath)) {
      throw new Error('Document file not found on disk');
    }

    const stats = fs.statSync(absolutePath);
    return {
      doc,
      stream: fs.createReadStream(absolutePath),
      absolutePath,
      size: stats.size,
      ext: path.extname(absolutePath),
      mimeType: this.getMimeType(path.extname(absolutePath))
    };
  }

  /**
   * Returns document history/audit for an entity.
   */
  static getHistory(entityType, entityId) {
    return db.prepare(`
      SELECT d.*, u.name as uploader_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.entity_type = ? AND d.entity_id = ?
      ORDER BY d.created_at DESC
    `).all(entityType, entityId);
  }

  /**
   * Get document statistics.
   */
  static getStats() {
    const total = db.prepare('SELECT count(*) as count FROM documents').get().count;
    const byType = db.prepare(`
      SELECT doc_type, count(*) as count, sum(file_size_kb) as total_size_kb
      FROM documents GROUP BY doc_type ORDER BY count DESC
    `).all();
    const byEntity = db.prepare(`
      SELECT entity_type, count(*) as count 
      FROM documents GROUP BY entity_type ORDER BY count DESC
    `).all();

    let totalSizeKb = 0;
    byType.forEach(t => totalSizeKb += (t.total_size_kb || 0));

    return {
      totalDocuments: total,
      totalSizeMB: parseFloat((totalSizeKb / 1024).toFixed(2)),
      byDocType: byType,
      byEntityType: byEntity
    };
  }

  static getMimeType(ext) {
    const map = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv',
      '.txt': 'text/plain',
    };
    return map[ext?.toLowerCase()] || 'application/octet-stream';
  }
}

module.exports = DocumentService;
