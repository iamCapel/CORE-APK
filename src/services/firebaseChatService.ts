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
import { getUserById, getUserByUsername } from './firebaseUserStorage';

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

// Detecta si un string es un Firebase UID (28 caracteres) o un username
function looksLikeFirebaseUID(str: string): boolean {
  return str.length > 20 && /^[a-zA-Z0-9_-]+$/.test(str);
}

// Resuelve un identificador (UID o username) a username
async function resolveToUsername(identifier: string): Promise<string> {
  if (!identifier) return identifier;
  
  // Si parece un UID, resolver a username
  if (looksLikeFirebaseUID(identifier)) {
    const user = await getUserById(identifier);
    return user?.username || identifier;
  }
  
  // Si ya es un username, verificar que exista
  const user = await getUserByUsername(identifier);
  return user?.username || identifier;
}

// Crea chatId usando usernames ordenados alfabéticamente
async function getChatId(id1: string, id2: string): Promise<string> {
  const username1 = await resolveToUsername(id1);
  const username2 = await resolveToUsername(id2);
  return [username1, username2].sort().join('_');
}

export async function getOrCreateChat(
  currentUserId: string,
  currentUserName: string,
  otherUserId: string,
  otherUserName: string,
  currentUserAvatar = '',
  otherUserAvatar = ''
): Promise<string> {
  console.log('[chatService] 🔍 getOrCreateChat - INPUT:', {
    currentUserId,
    currentUserName,
    otherUserId,
    otherUserName
  });
  
  // Resolver ambos identificadores a usernames y UIDs
  let resolvedCurrentUsername = currentUserName;
  let resolvedCurrentUid = currentUserId;
  let resolvedOtherUsername = otherUserName;
  let resolvedOtherUid = otherUserId;
  
  // Detectar y resolver currentUser
  if (looksLikeFirebaseUID(currentUserId)) {
    const user = await getUserById(currentUserId);
    if (user) {
      resolvedCurrentUsername = user.username;
      resolvedCurrentUid = user.id;
    }
  } else {
    const user = await getUserByUsername(currentUserId);
    if (user) {
      resolvedCurrentUsername = user.username;
      resolvedCurrentUid = user.id;
    }
  }
  
  // Detectar y resolver otherUser
  if (looksLikeFirebaseUID(otherUserId)) {
    const user = await getUserById(otherUserId);
    if (user) {
      resolvedOtherUsername = user.username;
      resolvedOtherUid = user.id;
    }
  } else {
    const user = await getUserByUsername(otherUserId);
    if (user) {
      resolvedOtherUsername = user.username;
      resolvedOtherUid = user.id;
    }
  }
  
  console.log('[chatService] 🔍 Usuarios resueltos:', {
    currentInput: currentUserId,
    currentUsername: resolvedCurrentUsername,
    currentUid: resolvedCurrentUid,
    otherInput: otherUserId,
    otherUsername: resolvedOtherUsername,
    otherUid: resolvedOtherUid
  });
  
  // Crear chatId con usernames ordenados
  const chatId = [resolvedCurrentUsername, resolvedOtherUsername].sort().join('_');
  console.log('[chatService] 📝 ChatId creado:', chatId);
  
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    console.log('[chatService] 🆕 Creando nuevo chat');
    await setDoc(chatRef, {
      participants: [resolvedCurrentUsername, resolvedOtherUsername],
      participantNames: {
        [resolvedCurrentUsername]: currentUserName || resolvedCurrentUsername,
        [resolvedOtherUsername]: otherUserName || resolvedOtherUsername,
      },
      participantAvatars: {
        [resolvedCurrentUsername]: currentUserAvatar,
        [resolvedOtherUsername]: otherUserAvatar,
      },
      lastMessage: '',
      lastMessageTime: null,
      lastMessageSenderId: '',
      unreadCount: {
        [resolvedCurrentUsername]: 0,
        [resolvedOtherUsername]: 0,
      },
      createdAt: serverTimestamp(),
    });
  } else {
    console.log('[chatService] ✅ Chat ya existe');
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
  
  console.log('[chatService] 📤 sendMessage - INPUT:', {
    chatId,
    senderId,
    senderName,
    otherUserId,
    text: trimmed.substring(0, 50)
  });
  
  // Resolver senderId y otherUserId a usernames si son UIDs
  let resolvedSenderId = senderId;
  let resolvedSenderUid = senderId;
  let resolvedOtherUsername = otherUserId;
  let resolvedOtherUid = otherUserId;
  
  // Resolver senderId
  if (looksLikeFirebaseUID(senderId)) {
    const user = await getUserById(senderId);
    if (user) {
      resolvedSenderId = user.username;
      resolvedSenderUid = user.id;
    } else {
      console.warn('[chatService] ⚠️ No se pudo resolver senderId UID:', senderId);
    }
  } else {
    // Es username, obtener el UID
    const user = await getUserByUsername(senderId);
    if (user) {
      resolvedSenderId = user.username;
      resolvedSenderUid = user.id;
    } else {
      // Si no se encuentra, asumir que es username válido
      resolvedSenderId = senderId;
      console.log('[chatService] ℹ️ senderId no encontrado en BD, usando como username:', senderId);
    }
  }
  
  // Resolver otherUserId
  if (looksLikeFirebaseUID(otherUserId)) {
    const user = await getUserById(otherUserId);
    if (user) {
      resolvedOtherUsername = user.username;
      resolvedOtherUid = user.id;
    } else {
      console.warn('[chatService] ⚠️ No se pudo resolver otherUserId UID:', otherUserId);
    }
  } else {
    // Es username, obtener el UID
    const user = await getUserByUsername(otherUserId);
    if (user) {
      resolvedOtherUsername = user.username;
      resolvedOtherUid = user.id;
    } else {
      // Si no se encuentra, asumir que es username válido
      resolvedOtherUsername = otherUserId;
      console.log('[chatService] ℹ️ otherUserId no encontrado en BD, usando como username:', otherUserId);
    }
  }
  
  console.log('[chatService] 📤 sendMessage - Identidades resueltas:', {
    input_chatId: chatId,
    input_senderId: senderId,
    input_otherUserId: otherUserId,
    resolved_senderUsername: resolvedSenderId,
    resolved_senderUid: resolvedSenderUid,
    resolved_otherUsername: resolvedOtherUsername,
    resolved_otherUid: resolvedOtherUid,
    text: trimmed.substring(0, 50)
  });

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(messagesRef, {
    senderId: resolvedSenderId,
    senderName,
    senderUid: resolvedSenderUid,
    text: trimmed,
    timestamp: serverTimestamp(),
    read: false,
  });

  console.log('[chatService] 💾 ANTES de updateDoc - Actualizando unreadCount para:', resolvedOtherUsername);
  console.log('[chatService] 💾 updateDoc payload:', {
    chatId,
    lastMessage: trimmed.substring(0, 30),
    lastMessageSenderId: resolvedSenderId,
    unreadCountKey: `unreadCount.${resolvedOtherUsername}`,
    incrementValue: 1
  });

  const chatRef = doc(db, 'chats', chatId);
  
  try {
    await updateDoc(chatRef, {
      lastMessage: trimmed,
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: resolvedSenderId,
      [`unreadCount.${resolvedOtherUsername}`]: increment(1),
    });
    console.log('[chatService] ✅ updateDoc EXITOSO - unreadCount incrementado para:', resolvedOtherUsername);
  } catch (error) {
    console.error('[chatService] ❌ ERROR en updateDoc:', error);
    throw error;
  }

  // Enviar notificación push al destinatario usando el UID real
  sendPushNotification(resolvedOtherUid, senderName, trimmed, chatId).catch(() => {});
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
  console.log('[chatService] 👁️ markMessagesAsRead - INPUT:', { chatId, userId });
  
  // Resolver userId a username si es UID
  let resolvedUsername = userId;
  if (looksLikeFirebaseUID(userId)) {
    const user = await getUserById(userId);
    if (user) resolvedUsername = user.username;
  } else {
    const user = await getUserByUsername(userId);
    if (user) resolvedUsername = user.username;
    else resolvedUsername = userId;  // Asumir que ya es username válido
  }
  
  console.log('[chatService] 👁️ markMessagesAsRead - ANTES de resetear unreadCount para:', resolvedUsername);
  console.log('[chatService] 👁️ markMessagesAsRead payload:', {
    chatId,
    unreadCountKey: `unreadCount.${resolvedUsername}`,
    newValue: 0
  });
  
  const chatRef = doc(db, 'chats', chatId);
  
  try {
    await updateDoc(chatRef, {
      [`unreadCount.${resolvedUsername}`]: 0,
    });
    console.log('[chatService] ✅ markMessagesAsRead EXITOSO - unreadCount reseteado a 0 para:', resolvedUsername);
  } catch (error) {
    console.error('[chatService] ❌ ERROR en markMessagesAsRead:', error);
    throw error;
  }
}

export function subscribeToUserChats(
  userId: string,
  callback: (chats: ChatRoom[]) => void
): Unsubscribe {
  let unsubscribe: Unsubscribe | null = null;
  let isActive = true;

  // Resolver userId a username de forma async antes de suscribirse
  (async () => {
    try {
      let resolvedUsername = userId;
      let resolvedUid = userId;
      
      if (looksLikeFirebaseUID(userId)) {
        const user = await getUserById(userId);
        if (user) {
          resolvedUsername = user.username;
          resolvedUid = user.id;
        }
      } else {
        const user = await getUserByUsername(userId);
        if (user) {
          resolvedUsername = user.username;
          resolvedUid = user.id;
        }
      }
      
      // Si se canceló antes de resolver, no hacer nada
      if (!isActive) return;
      
      console.log('[chatService] 📡 Suscribiendo a chats de:', resolvedUsername);
      
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', resolvedUsername)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const chats: ChatRoom[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ChatRoom, 'id'>),
        }));
        console.log('[chatService] 📥 onSnapshot - Chats raw recibidos:', {
          totalChats: chats.length,
          userIdentifier: resolvedUsername,
          chatsDetail: chats.map(c => ({
            id: c.id,
            participants: c.participants,
            unreadCount: c.unreadCount,
            lastMessage: c.lastMessage?.substring(0, 30)
          }))
        });
        // Sort by lastMessageTime descending (most recent first)
        chats.sort((a, b) => {
          const ta = a.lastMessageTime?.toMillis() ?? 0;
          const tb = b.lastMessageTime?.toMillis() ?? 0;
          return tb - ta;
        });

        // Deduplicar: un solo chat por usuario — conservar el más reciente
        const seen = new Set<string>();
        const deduped = chats.filter(chat => {
          const otherId = chat.participants.find(p => p !== resolvedUsername) || '';
          if (!otherId || seen.has(otherId)) return false;
          seen.add(otherId);
          return true;
        });

        callback(deduped);
      });
    } catch (error) {
      console.error('[chatService] Error al suscribirse a chats:', error);
      callback([]);
    }
  })();

  // Retornar función de cleanup
  return () => {
    isActive = false;
    if (unsubscribe) unsubscribe();
  };
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
