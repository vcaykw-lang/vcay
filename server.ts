import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Firebase Admin
  // Try to find the config file
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  let firebaseConfig: { projectId?: string } = {};
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  // Note: For custom tokens to work, we ideally need a service account.
  // In this environment, we'll try to initialize with default credentials.
  try {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log('Firebase Admin initialized');
  } catch (err) {
    console.error('Firebase Admin initialization failed:', err);
  }

  const db = admin.firestore();

  // API Routes
  
  // Guest: Send 6-digit OTP
  app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    try {
      await db.collection('otps').doc(email).set({
        otp,
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // MOCK EMAIL SENDING - Log to console
      console.log(`[AUTH] OTP for ${email}: ${otp}`);
      
      res.json({ success: true, message: 'OTP sent successfully (Check server logs)' });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  // Guest: Verify OTP
  app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    try {
      const doc = await db.collection('otps').doc(email).get();
      if (!doc.exists) return res.status(400).json({ error: 'No OTP found for this email' });

      const data = doc.data();
      if (data?.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
      if (Date.now() > data?.expiresAt) return res.status(400).json({ error: 'OTP expired' });

      // Ensure user exists with email
      const uid = `guest_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      try {
        await admin.auth().getUser(uid);
      } catch {
        await admin.auth().createUser({ uid, email });
      }
      
      const customToken = await admin.auth().createCustomToken(uid);

      // Clean up OTP
      await db.collection('otps').doc(email).delete();

      res.json({ customToken });
    } catch (err: unknown) {
      console.error(err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  // Admin: Login
  app.post('/api/auth/admin-login', async (req, res) => {
    const { username, password } = req.body;
    
    // User requested Username: Sunnydays#10 and Password: Alsalam@613
    if (username === 'Sunnydays#10' && password === 'Alsalam@613') {
      try {
        const uid = 'admin_sunnydays';
        const adminEmail = 'kddmilkchoco@gmail.com';
        try {
          await admin.auth().getUser(uid);
        } catch {
          await admin.auth().createUser({ uid, email: adminEmail });
        }
        
        const customToken = await admin.auth().createCustomToken(uid);
        res.json({ customToken });
      } catch (err: unknown) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
      }
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
