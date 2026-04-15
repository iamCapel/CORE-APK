import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limitToLast,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp | null;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage: string;
  lastMessageTime: Timestamp | null;
  lastMessageSenderId: string;
  unreadCount: Record<string, number>;
  createdAt: Timestamp | null;
}

function getChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

export async function getOrCreateChat(
  currentUserId: string,
  currentUserName: string,
  otherUserId: string,
  otherUserName: string,
  currentUserAvatar = '',
  otherUserAvatar = ''
): Promise<string> {
  const chatId = getChatId(currentUserId, otherUserId);
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [currentUserId, otherUserId],
      participantNames: {
        [currentUserId]: currentUserName,
        [otherUserId]: otherUserName,
      },
      participantAvatars: {
        [currentUserId]: currentUserAvatar,
        [otherUserId]: otherUserAvatar,
      },
      lastMessage: '',
      lastMessageTime: null,
      lastMessageSenderId: '',
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
      createdAt: serverTimestamp(),
    });
  }

  return chatId;
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  text: string,
  otherUserId: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(messagesRef, {
    senderId,
    senderName,
    text: trimmed,
    timestamp: serverTimestamp(),
    read: false,
  });

  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: trimmed,
    lastMessageTime: serverTimestamp(),
    lastMessageSenderId: senderId,
    [`unreadCount.${otherUserId}`]: increment(1),
  });

  // Enviar notificación push al destinatario (fire-and-forget, no bloquea el chat)
  sendPushNotification(otherUserId, senderName, trimmed, chatId).catch(() => {});
}

/**
 * Obtiene el token FCM del destinatario y llama al endpoint /api/notify.
 * Se ejecuta en segundo plano — los errores no afectan el envío del mensaje.
 */
async function sendPushNotification(
  recipientId: string,
  senderName: string,
  messageText: string,
  chatId: string
): Promise<void> {
  try {
    const userSnap = await getDoc(doc(db, 'users', recipientId));
    if (!userSnap.exists()) return;
    const fcmToken = userSnap.data()?.fcmToken;
    if (!fcmToken) return;

    const body = messageText.length > 100
      ? messageText.substring(0, 100) + '...'
      : messageText;

    // En Android WebView las rutas relativas no funcionan — usar URL absoluta
    const notifyUrl = process.env.REACT_APP_VERCEL_URL
      ? `https://${process.env.REACT_APP_VERCEL_URL}/api/notify`
      : 'https://mopc-core.vercel.app/api/notify';

    const response = await fetch(notifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-notify-secret': process.env.REACT_APP_NOTIFY_SECRET || '',
      },
      body: JSON.stringify({
        token: fcmToken,
        title: senderName,
        body,
        data: { chatId, senderId: recipientId, type: 'chat_message' },
      }),
    });

    // Si el token expiró, limpiarlo de Firestore
    if (response.status === 410) {
      await updateDoc(doc(db, 'users', recipientId), { fcmToken: null });
    }
  } catch (_) {
    // Silenciar errores — la notificación es opcional
  }
}

export async function markMessagesAsRead(
  chatId: string,
  userId: string
): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    [`unreadCount.${userId}`]: 0,
  });
}

export function subscribeToUserChats(
  userId: string,
  callback: (chats: ChatRoom[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const chats: ChatRoom[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ChatRoom, 'id'>),
    }));

    // Sort by lastMessageTime descending (most recent first)
    chats.sort((a, b) => {
      const ta = a.lastMessageTime?.toMillis() ?? 0;
      const tb = b.lastMessageTime?.toMillis() ?? 0;
      return tb - ta;
    });

    // Deduplicar: un solo chat por usuario — conservar el más reciente
    const seen = new Set<string>();
    const deduped = chats.filter(chat => {
      const otherId = chat.participants.find(p => p !== userId) || '';
      if (!otherId || seen.has(otherId)) return false;
      seen.add(otherId);
      return true;
    });

    callback(deduped);
  });
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc'),
    limitToLast(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, 'id'>),
      }));
      callback(messages);
    },
    (error) => console.error('[Chat] subscribeToMessages error:', error)
  );
}

export async function deleteChatRoom(chatId: string): Promise<void> {
  const batch = writeBatch(db);
  const messagesSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
  messagesSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'chats', chatId));
  await batch.commit();
}
