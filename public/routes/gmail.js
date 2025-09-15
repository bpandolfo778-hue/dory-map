import express from 'express';
import { google } from 'googleapis';
import { pool } from '../server.js';
import { extractCandidates } from '../services/parser.js';

const router = express.Router();

async function getGoogleAuthForUser(user_id) {
  const row = await pool.query(
    `SELECT * FROM integration_tokens WHERE user_id = $1 AND provider = 'google' ORDER BY id DESC LIMIT 1`,
    [user_id]
  );
  if (!row.rows.length) return null;
  const tokens = row.rows[0];
  const oAuth2Client = new google.auth.OAuth2();
  oAuth2Client.setCredentials({ access_token: tokens.access_token, refresh_token: tokens.refresh_token });
  return oAuth2Client;
}

router.get('/scan', async (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) return res.status(401).send('Login first');

  const auth = await getGoogleAuthForUser(user_id);
  if (!auth) return res.status(400).send('Google not connected');

  const gmail = google.gmail({ version: 'v1', auth });
  const msgs = await gmail.users.messages.list({ userId: 'me', maxResults: 10, q: 'newer_than:7d -category:promotions' });
  const results = [];

  if (msgs.data.messages) {
    for (const m of msgs.data.messages) {
      const full = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata', metadataHeaders: ['From','Subject','Date','To'] });
      const snippet = full.data.snippet || '';
      const headers = full.data.payload?.headers || [];
      const subject = headers.find(h=>h.name==='Subject')?.value || '';
      const frm = headers.find(h=>h.name==='From')?.value || '';

      const extracted = extractCandidates(subject + ' ' + snippet);
      if (extracted.type !== 'none') {
        results.push({ id: m.id, from: frm, subject, snippet, extracted });
      }
    }
  }

  // Save basic leads
  for (const r of results.filter(r => r.extracted.type === 'lead')) {
    await pool.query(
      `INSERT INTO lead (user_id, name, email, source, snippet) VALUES ($1,$2,$3,$4,$5)`,
      [user_id, null, null, r.from, r.snippet?.slice(0,240) || '']
    );
  }

  res.json({ count: results.length, items: results });
});

export default router;
