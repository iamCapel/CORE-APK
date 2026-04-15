import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useNotificationSound } from '../hooks/useNotificationSound';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { getAllUsers, UserData } from '../services/firebaseUserStorage';
import {
  ChatRoom,
  ChatMessage,
  subscribeToUserChats,
  subscribeToMessages,
  getOrCreateChat,
  sendMessage,
  markMessagesAsRead,
  deleteChatRoom,
} from '../services/firebaseChatService';
import './ChatPage.css';

/* ─── Swipe-to-delete ─── */
const SWIPE_DELETE_WIDTH = 80;
const SWIPE_THRESHOLD = 40;

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

function SwipeChatItem({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const [offset, setOffset] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const startXRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const draggingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentOffsetRef.current = isOpen ? -SWIPE_DELETE_WIDTH : 0;
    draggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    const dx = e.touches[0].clientX - startXRef.current + currentOffsetRef.current;
    const clamped = Math.max(-SWIPE_DELETE_WIDTH, Math.min(0, dx));
    setOffset(clamped);
  };

  const handleTouchEnd = () => {
    draggingRef.current = false;
    if (offset < -SWIPE_THRESHOLD) {
      setOffset(-SWIPE_DELETE_WIDTH);
      setIsOpen(true);
    } else {
      setOffset(0);
      setIsOpen(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOffset(0);
    setIsOpen(false);
    onDelete();
  };

  const handleItemClick = () => {
    if (isOpen) { setOffset(0); setIsOpen(false); }
  };

  return (
    <div className="cp-swipe-row">
      <div className="cp-swipe-actions">
        <button className="cp-swipe-delete-btn" onClick={handleDelete}>
          <TrashIcon />
          <span>Borrar</span>
        </button>
      </div>
      <div
        className="cp-swipe-content"
        style={{ transform: `translateX(${offset}px)`, transition: draggingRef.current ? 'none' : 'transform 0.22s cubic-bezier(.25,.46,.45,.94)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleItemClick}
      >
        {children}
      </div>
    </div>
  );
}

interface ChatUser {
  id?: string;
  username: string;
  name: string;
  email?: string;
  profilePhoto?: string;
  avatar?: string;
  role?: string;
}

interface ChatPageProps {
  currentUser: ChatUser;
  onBack: () => void;
}

/* ── Icons ── */
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const NewChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="12" y1="8" x2="12" y2="14" />
    <line x1="9" y1="11" x2="15" y2="11" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function formatTime(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 86400000;

  if (diff < dayMs && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 2 * dayMs) return 'Ayer';
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' });
}

function getUserInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function AvatarBubble({ name, photo, size = 42 }: { name: string; photo?: string; size?: number }) {
  if (photo) {
    return <img src={photo} alt={name} className="chat-avatar-img" style={{ width: size, height: size }} />;
  }
  return (
    <div className="chat-avatar-initials" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {getUserInitials(name)}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUBCOMPONENT: individual conversation view
───────────────────────────────────────────── */
function ConversationView({
  chatId,
  currentUserId,
  currentUserName,
  otherUser,
  onBack,
}: {
  chatId: string;
  currentUserId: string;
  currentUserName: string;
  otherUser: { id: string; name: string; photo?: string };
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Rastrear IDs vistos para detectar mensajes nuevos con precisión
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstSnapshotRef = useRef(true);
  // IDs optimistas pendientes de confirmar por Firestore
  const pendingOptimisticRef = useRef<Set<string>>(new Set());
  const { play: playSound } = useNotificationSound();

  useEffect(() => {
    seenIdsRef.current = new Set();
    isFirstSnapshotRef.current = true;
    pendingOptimisticRef.current = new Set();

    const unsub = subscribeToMessages(chatId, (msgs) => {
      if (isFirstSnapshotRef.current) {
        seenIdsRef.current = new Set(msgs.map(m => m.id));
        isFirstSnapshotRef.current = false;
        setMessages(msgs);
        return;
      }
      const newFromOther = msgs.filter(
        m => !seenIdsRef.current.has(m.id) && m.senderId !== currentUserId
      );
      seenIdsRef.current = new Set(msgs.map(m => m.id));
      if (newFromOther.length > 0) {
        playSound();
        try { navigator.vibrate?.([80]); } catch (_) {}
        markMessagesAsRead(chatId, currentUserId);
      }
      // Reemplazar mensajes optimistas por los confirmados de Firestore
      setMessages(prev => {
        const firестoreIds = new Set(msgs.map(m => m.id));
        // Conservar optimistas que aún no llegaron de Firestore
        const stillPending = prev.filter(
          m => m.id.startsWith('optimistic_') && !firестoreIds.has(m.id)
        );
        return [...msgs, ...stillPending];
      });
    });
    markMessagesAsRead(chatId, currentUserId);
    return () => unsub();
  }, [chatId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const trimmed = text.trim();
    setText('');
    // Optimistic update: mostrar el mensaje al instante
    const optimisticId = `optimistic_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      senderId: currentUserId,
      senderName: currentUserName,
      text: trimmed,
      timestamp: null,
      read: false,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    pendingOptimisticRef.current.add(optimisticId);
    setSending(true);
    try {
      await sendMessage(chatId, currentUserId, currentUserName, trimmed, otherUser.id);
    } catch (_) {
      // Revertir optimista si falló
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
    } finally {
      setSending(false);
      pendingOptimisticRef.current.delete(optimisticId);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || sending) return;
    setSending(true);
    try {
      const path = `chat_images/${chatId}/${Date.now()}_${file.name}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      await sendMessage(chatId, currentUserId, currentUserName, `[img]${url}`, otherUser.id);
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="chat-conversation">
      {/* Header */}
      <div className="chat-conv-header">
        <button className="chat-back-btn" onClick={onBack}>
          <BackIcon />
        </button>
        <AvatarBubble name={otherUser.name} photo={otherUser.photo} size={36} />
        <div className="chat-conv-header-info">
          <span className="chat-conv-header-name">{otherUser.name}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages-area">
        {messages.length === 0 && (
          <div className="chat-empty-messages">
            <p>Inicia la conversación con {otherUser.name}</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`chat-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
              {!isMine && (
                <AvatarBubble name={otherUser.name} photo={otherUser.photo} size={28} />
              )}
              <div className={`chat-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'} ${msg.text.startsWith('[img]') ? 'bubble-img' : ''}`}>
                {msg.text.startsWith('[img]') ? (
                  <img src={msg.text.slice(5)} alt="imagen" className="chat-bubble-image" />
                ) : (
                  <span className="chat-bubble-text">{msg.text}</span>
                )}
                <span className="chat-bubble-meta">
                  {formatTime(msg.timestamp)}
                  {isMine && <CheckIcon />}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />
        <button
          className="chat-image-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          title="Enviar imagen"
        >
          <ImageIcon />
        </button>
        <textarea
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe un mensaje..."
          rows={1}
        />
        <button
          className={`chat-send-btn ${text.trim() ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!text.trim() || sending}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUBCOMPONENT: new chat user picker
───────────────────────────────────────────── */
function NewChatModal({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onSelectUser,
  onClose,
}: {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  onSelectUser: (chatId: string, otherUser: { id: string; name: string; photo?: string }) => void;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers().then((all) => {
      setUsers(all.filter((u) => u.id !== currentUserId));
      setLoading(false);
    });
  }, [currentUserId]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (user: UserData) => {
    const chatId = await getOrCreateChat(
      currentUserId,
      currentUserName,
      user.id,
      user.name,
      currentUserAvatar,
      user.avatar || ''
    );
    onSelectUser(chatId, { id: user.id, name: user.name, photo: user.avatar });
    onClose();
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <span>Nuevo mensaje</span>
          <button className="chat-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="chat-modal-search">
          <SearchIcon />
          <input
            autoFocus
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="chat-modal-list">
          {loading && <div className="chat-modal-loading">Cargando usuarios...</div>}
          {!loading && filtered.length === 0 && (
            <div className="chat-modal-loading">Sin resultados</div>
          )}
          {filtered.map((u) => (
            <button key={u.id} className="chat-modal-user-item" onClick={() => handleSelect(u)}>
              <AvatarBubble name={u.name} photo={u.avatar} size={38} />
              <div className="chat-modal-user-info">
                <span className="chat-modal-user-name">{u.name}</span>
                <span className="chat-modal-user-sub">@{u.username} · {u.role}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT: ChatPage
───────────────────────────────────────────── */
const ChatPage: React.FC<ChatPageProps> = ({ currentUser, onBack }) => {
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [allUsers, setAllUsers] = useState<import('../services/firebaseUserStorage').UserData[]>([]);
  const [search, setSearch] = useState('');
  const [selectedChat, setSelectedChat] = useState<{
    chatId: string;
    otherUser: { id: string; name: string; photo?: string };
  } | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  const currentUserId = currentUser.id || currentUser.username;
  const currentUserAvatar = currentUser.profilePhoto || currentUser.avatar || '';
  const currentUserName = currentUser.name;
  const prevUnreadRef = useRef<number>(-1);
  const { play: playSoundInList } = useNotificationSound();

  // Refs para acceder siempre al valor más reciente sin re-registrar el listener
  const selectedChatRef = useRef(selectedChat);
  const onBackRef = useRef(onBack);
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);
  useEffect(() => { onBackRef.current = onBack; }, [onBack]);

  // Registrar el backButton UNA SOLA VEZ para evitar la brecha entre re-registros
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove: () => void } | null = null;
    CapacitorApp.addListener('backButton', () => {
      if (selectedChatRef.current) {
        setSelectedChat(null);
      } else {
        onBackRef.current();
      }
    }).then(l => { handle = l; });
    return () => { handle?.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar usuarios para resolver nombres faltantes
  useEffect(() => {
    getAllUsers().then(setAllUsers);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const unsub = subscribeToUserChats(currentUserId, (updatedChats) => {
      const total = updatedChats.reduce(
        (sum, c) => sum + (c.unreadCount?.[currentUserId] || 0),
        0
      );
      if (prevUnreadRef.current >= 0 && total > prevUnreadRef.current) {
        playSoundInList();
      }
      prevUnreadRef.current = total;
      setChats(updatedChats);
    });
    return () => unsub();
  }, [currentUserId]);

  const filteredChats = chats.filter((chat) => {
    const otherId = chat.participants.find((p) => p !== currentUserId) || '';
    const fromChat = chat.participantNames?.[otherId] || '';
    const fromDb = allUsers.find(u => u.id === otherId || u.username === otherId);
    const otherName = (fromChat && fromChat !== 'Usuario') ? fromChat : (fromDb?.name || fromDb?.username || otherId);
    return otherName.toLowerCase().includes(search.toLowerCase());
  });

  const resolveOtherName = (chat: ChatRoom, otherId: string): string => {
    const fromChat = chat.participantNames?.[otherId];
    if (fromChat && fromChat !== 'Usuario') return fromChat;
    const fromDb = allUsers.find(u => u.id === otherId || u.username === otherId);
    return fromDb?.name || fromDb?.username || otherId || 'Usuario';
  };

  const totalUnread = chats.reduce(
    (sum, c) => sum + (c.unreadCount?.[currentUserId] || 0),
    0
  );

  const handleOpenChat = (chat: ChatRoom) => {
    const otherId = chat.participants.find((p) => p !== currentUserId) || '';
    const otherName = resolveOtherName(chat, otherId);
    const otherPhoto = chat.participantAvatars?.[otherId];
    setSelectedChat({ chatId: chat.id, otherUser: { id: otherId, name: otherName, photo: otherPhoto } });
  };

  /* ── Conversation view ── */
  if (selectedChat) {
    return (
      <div className="chat-page">
        <ConversationView
          chatId={selectedChat.chatId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          otherUser={selectedChat.otherUser}
          onBack={() => setSelectedChat(null)}
        />
      </div>
    );
  }

  /* ── Chat list view ── */
  return (
    <div className="chat-page">
      {/* Topbar del Mural */}
      <div className="chat-topbar">
        <button className="chat-back-btn" onClick={onBack}>
          <BackIcon />
        </button>
        <div className="chat-mural-header">
          <span className="chat-mural-title">Mural de Chats</span>
          <span className="chat-mural-subtitle">
            {chats.length === 0
              ? 'Sin conversaciones aún'
              : totalUnread > 0
              ? <><strong>{totalUnread} sin leer</strong> &middot; {chats.length} conversaci{chats.length === 1 ? 'ón' : 'ones'}</>
              : <>{chats.length} conversaci{chats.length === 1 ? 'ón' : 'ones'} &middot; Todo leído</>}
          </span>
        </div>
        <button className="chat-new-btn" onClick={() => setShowNewChat(true)} title="Nuevo mensaje">
          <NewChatIcon />
        </button>
      </div>

      {/* Search */}
      <div className="chat-search-bar">
        <SearchIcon />
        <input
          placeholder="Buscar conversación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="chat-list">
        {filteredChats.length === 0 && (
          <div className="chat-list-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>No hay conversaciones aún</p>
            <button className="chat-start-btn" onClick={() => setShowNewChat(true)}>
              Iniciar un chat
            </button>
          </div>
        )}
        {filteredChats.map((chat) => {
          const otherId = chat.participants.find((p) => p !== currentUserId) || '';
          const otherName = resolveOtherName(chat, otherId);
          const otherPhoto = chat.participantAvatars?.[otherId];
          const unread = chat.unreadCount?.[currentUserId] || 0;
          const isLastMine = chat.lastMessageSenderId === currentUserId;

          return (
            <SwipeChatItem key={chat.id} onDelete={() => deleteChatRoom(chat.id)}>
              <button className={`chat-list-item${unread > 0 ? ' has-unread' : ''}`} onClick={() => handleOpenChat(chat)}>
                <div className="chat-list-avatar">
                  <AvatarBubble name={otherName} photo={otherPhoto} size={46} />
                  {unread > 0 && (
                    <span className="chat-list-unread">{unread > 99 ? '99+' : unread}</span>
                  )}
                </div>
                <div className="chat-list-info">
                  <div className="chat-list-row">
                    <span className="chat-list-name">{otherName}</span>
                    <span className="chat-list-time">{formatTime(chat.lastMessageTime)}</span>
                  </div>
                  <div className="chat-list-row">
                    <span className={`chat-list-preview ${unread > 0 ? 'unread' : ''}`}>
                      {isLastMine && <span className="chat-preview-you">Tú: </span>}
                      {chat.lastMessage || 'Inicia la conversación'}
                    </span>
                  </div>
                </div>
              </button>
            </SwipeChatItem>
          );
        })}
      </div>

      {/* New chat modal */}
      {showNewChat && (
        <NewChatModal
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
          onSelectUser={(chatId, otherUser) => setSelectedChat({ chatId, otherUser })}
          onClose={() => setShowNewChat(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;
