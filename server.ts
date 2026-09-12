import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import firebaseConfig from './firebase-applet-config.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ----------------------------------------------------
// API ROUTES (Must be registered BEFORE Vite middleware)
// ----------------------------------------------------

// 1. Health check & Firebase connection status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MalaTinta Studio Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    firebase: {
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: (firebaseConfig as Record<string, any>).firestoreDatabaseId || '(default)',
      authDomain: firebaseConfig.authDomain,
      authProviders: ['password', 'google.com'],
    },
  });
});

// 2. Client config bridge
app.get('/api/firebase/config', (req, res) => {
  res.json({
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    firestoreDatabaseId: (firebaseConfig as Record<string, any>).firestoreDatabaseId || '(default)',
    storageBucket: firebaseConfig.storageBucket,
    providersEnabled: {
      emailPassword: true,
      googleAuth: true,
    },
  });
});

// 3. User session sync endpoint with disk persistence
import fs from 'fs';

const USERS_FILE = path.join(process.cwd(), 'synced_users.json');

function loadPersistedUsers(): Map<string, { uid: string; email: string; displayName?: string; lastSeen: string; createdAt?: string }> {
  const map = new Map<string, { uid: string; email: string; displayName?: string; lastSeen: string; createdAt?: string }>();
  
  // Default system admin user
  map.set('677rpirToDgJ9lNJmsvqhxOOBKf1', {
    uid: '677rpirToDgJ9lNJmsvqhxOOBKf1',
    email: 'admin@MalaTinta Studio.com',
    displayName: 'Administrador MalaTinta Studio',
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        data.forEach((u) => {
          if (u && u.uid) {
            map.set(u.uid, u);
          }
        });
      }
    } catch (e) {
      console.warn('Error leyendo synced_users.json:', e);
    }
  }
  return map;
}

const activeSessions = loadPersistedUsers();

function savePersistedUsers() {
  try {
    const list = Array.from(activeSessions.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.warn('Error guardando synced_users.json:', e);
  }
}

app.post('/api/users/sync', (req, res) => {
  const { uid, email, displayName } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'uid y email son requeridos' });
  }

  const existing = activeSessions.get(uid);
  const record = {
    uid,
    email,
    displayName: displayName || email.split('@')[0],
    lastSeen: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  activeSessions.set(uid, record);
  savePersistedUsers();

  res.json({
    success: true,
    message: 'Sesión de usuario sincronizada con éxito',
    user: record,
    activeCount: activeSessions.size,
  });
});

app.get('/api/users/active-count', (req, res) => {
  res.json({
    activeCount: activeSessions.size,
  });
});

// 4. Admin users endpoint
app.get('/api/admin/users', (req, res) => {
  const usersList = Array.from(activeSessions.values()).map((s) => ({
    uid: s.uid,
    email: s.email,
    displayName: s.displayName || s.email.split('@')[0],
    createdAt: s.createdAt || s.lastSeen,
    lastLoginAt: s.lastSeen,
    uploadedFilesCount: 0,
  }));
  res.json({
    users: usersList,
    total: usersList.length,
  });
});

// ----------------------------------------------------
// VITE MIDDLEWARE SETUP
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MalaTinta Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
