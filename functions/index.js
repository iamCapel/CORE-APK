const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Se dispara cada vez que se crea un nuevo mensaje en un chat.
 * Envía una notificación push FCM al destinatario del mensaje.
 *
 * Estructura Firestore:
 *   chats/{chatId}                   → participantes, lastMessage, etc.
 *   chats/{chatId}/messages/{msgId}  → senderId, senderName, text, timestamp
 *   users/{userId}                   → fcmToken (guardado por la app al iniciar)
 */
exports.sendChatNotification = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const message = snap.data();
      const { chatId } = context.params;

      if (!message || !message.senderId) return null;

      // Obtener el documento del chat para saber quiénes participan
      const chatDoc = await db.doc(`chats/${chatId}`).get();
      if (!chatDoc.exists) return null;

      const chat = chatDoc.data();
      if (!chat || !Array.isArray(chat.participants)) return null;

      // El destinatario es el participante que NO es el enviador
      const recipientId = chat.participants.find((p) => p !== message.senderId);
      if (!recipientId) return null;

      // Obtener el token FCM del destinatario
      const userDoc = await db.doc(`users/${recipientId}`).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data();
      const fcmToken = userData && userData.fcmToken;
      if (!fcmToken) {
        console.log(`[FCM] Usuario ${recipientId} no tiene token FCM registrado`);
        return null;
      }

      const senderName = message.senderName || 'Alguien';
      const body = message.text
        ? (message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text)
        : 'Te envió un mensaje';

      // Enviar la notificación push
      await messaging.send({
        token: fcmToken,
        notification: {
          title: senderName,
          body: body,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'chat_messages',
            priority: 'max',
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            icon: 'ic_stat_notification',
          },
        },
        data: {
          chatId: chatId,
          senderId: message.senderId,
          senderName: senderName,
          type: 'chat_message',
        },
      });

      console.log(`[FCM] Notificación enviada a ${recipientId} (chat: ${chatId})`);
      return null;
    } catch (error) {
      console.error('[FCM] Error enviando notificación:', error);
      return null;
    }
  });

/**
 * Limpia el token FCM obsoleto cuando un dispositivo intenta enviar a
 * un token que ya no es válido (el usuario desinstalió o borró datos).
 */
exports.cleanInvalidToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Se requiere autenticación');
  }

  const userId = context.auth.uid;
  await db.doc(`users/${userId}`).update({ fcmToken: admin.firestore.FieldValue.delete() });
  console.log(`[FCM] Token limpiado para usuario ${userId}`);
  return { success: true };
});
