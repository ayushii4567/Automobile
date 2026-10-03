const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'apex-horizon-motors-jwt-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      title: user.title,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Strict Authentication middleware - verifies Bearer token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token.' });
    }
    req.user = decodedUser;
    next();
  });
}

// Optional Auth (populates req.user if valid token present, null otherwise)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (!err) {
      req.user = decodedUser;
    } else {
      req.user = null;
    }
    next();
  });
}

// Role-Based Access Control guard
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    // Normalize roles (e.g. 'ADMIN', 'admin', 'SALES_EXECUTIVE', 'sales')
    const userRole = (req.user.role || '').toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    const isAllowed = normalizedAllowed.includes(userRole) || 
      (userRole === 'SALES' && normalizedAllowed.includes('SALES_EXECUTIVE')) ||
      (userRole === 'SALES_EXECUTIVE' && normalizedAllowed.includes('SALES'));

    if (!isAllowed) {
      return res.status(403).json({ 
        error: `Access denied: Requires [${allowedRoles.join(' or ')}] privileges.` 
      });
    }
    next();
  };
}

// Helper to record audit log in SQLite
function recordAudit(db, user, action, moduleName, description, recordId = null, ipAddress = '127.0.0.1') {
  try {
    const id = `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let userId = null;
    if (user && user.id && user.id !== 'anon' && user.id !== 'system') {
      const u = db.prepare('SELECT id FROM users WHERE id = ?').get(user.id);
      if (u) userId = u.id;
    }
    const userName = user?.name || user?.username || 'System User';
    const userRole = (user?.role || 'SYSTEM').toUpperCase();
    const timestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, module, record_id, description, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, userName, userRole, action, moduleName, recordId, description, ipAddress, timestamp);
  } catch (err) {
    console.error('Audit log recording error:', err.message);
  }
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateToken,
  optionalAuth,
  requireRole,
  recordAudit
};
