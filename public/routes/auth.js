import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { pool } from '../server.js';

dotenv.config();
const router = express.Router();

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback'
  );
}

// Demo login via email
router.post('/signup', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const upsert = await pool.query(
    `INSERT INTO app_user (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id, email`, [email]);
  req.session.user_id = upsert.rows[0].id;
  res.json(upsert.rows[0]);
});

// Start Google OAuth
router.get('/google', (req, res) => {
  if (!req.session.user_id) return res.status(401).send('Login first');
  const oAuth2Client = getOAuthClient();
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline', scope: scopes, prompt: 'consent'
  });
  res.redirect(url);
});

// OAuth callback
router.get('/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');
  if (!req.session.user_id) return res.status(401).send('Login first');

  const oAuth2Client = getOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  const { access_token, refresh_token, expiry_date, scope } = tokens;

  await pool.query(
    `INSERT INTO integration_tokens (user_id, provider, access_token, refresh_token, scope, token_expires_at)
     VALUES ($1,$2,$3,$4,$5, to_timestamp($6/1000))`,
    [req.session.user_id, 'google', access_token, refresh_token || null, scope || null, expiry_date || (Date.now()+3600*1000)]
  );
  res.send('Google connected. You can close this tab and return to the app.');
});

export default router;
