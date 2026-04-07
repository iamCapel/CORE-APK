import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
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

    callback(chats);
  });
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ChatMessage, 'id'>),
    }));
    callback(messages);
  });
}
