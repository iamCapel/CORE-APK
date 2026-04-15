import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Inicializar Firebase Admin SDK una sola vez (singleton)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar secret interno para evitar usos no autorizados
  const authHeader = req.headers['x-notify-secret'];
  if (authHeader !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { token, title, body, data } = req.body;

  if (!token || !title) {
    return res.status(400).json({ error: 'Missing required fields: token, title' });
  }

  try {
    await admin.messaging().send({
      token,
      notification: { title, body: body || '' },
      android: {
        priority: 'high',
        notification: {
          channelId: 'chat_messages',
          priority: 'max',
          sound: 'default',
        },
      },
      data: data || {},
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    // Token inválido o expirado — el cliente debe limpiar su token
    if (error.code === 'messaging/registration-token-not-registered') {
      return res.status(410).json({ error: 'token_expired' });
    }
    console.error('[notify] FCM error:', error.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
