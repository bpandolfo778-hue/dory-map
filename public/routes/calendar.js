import express from 'express';
import { google } from 'googleapis';
import { pool } from '../server.js';

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

router.post('/create', async (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) return res.status(401).send('Login first');
  const { title, starts_at, ends_at, attendees = [] } = req.body;
  if (!title || !starts_at) return res.status(400).json({ error: 'title and starts_at required' });

  const auth = await getGoogleAuthForUser(user_id);
  if (!auth) return res.status(400).send('Google not connected');

  const calendar = google.calendar({ version: 'v3', auth });
  const event = {
    summary: title,
    start: { dateTime: new Date(starts_at).toISOString() },
    end: { dateTime: new Date(ends_at || starts_at).toISOString() },
    attendees: attendees.map(e => ({ email: e }))
  };

  const ins = await calendar.events.insert({ calendarId: 'primary', requestBody: event });
  await pool.query(
    `INSERT INTO event (user_id, title, starts_at, ends_at, source, external_id) VALUES ($1,$2,$3,$4,$5,$6)`,
    [user_id, title, starts_at, ends_at || starts_at, 'manual', ins.data.id]
  );

  res.json({ ok: true, id: ins.data.id });
});

export default router;
