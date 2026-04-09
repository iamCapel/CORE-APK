import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from '../services/firebaseChatService';
import './FloatingChat.css';

/* ─── interfaces ─── */
interface ChatUser {
  id?: string;
  username: string;
  name: string;
  profilePhoto?: string;
  avatar?: string;
}

interface FloatingChatProps {
  currentUser: ChatUser;
  unreadCount?: number;
  onUnreadChange?: (count: number) => void;
}

/* ─── helpers ─── */
function formatTime(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 86400000 && date.getDate() === now.getDate())
    return date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
  if (diff < 2 * 86400000) return 'Ayer';
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' });
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function Avatar({ name, photo, size = 40 }: { name: string; photo?: string; size?: number }) {
  if (photo)
    return <img src={photo} alt={name} className="fc-avatar-img" style={{ width: size, height: size }} />;
  return (
    <div className="fc-avatar-initials" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {getInitials(name)}
    </div>
  );
}

/* ─── icons ─── */
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
);
const NewChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="12" y1="8" x2="12" y2="14" /><line x1="9" y1="11" x2="15" y2="11" />
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/* ═══════════════════════════════════════════
   SUB: Conversation
═══════════════════════════════════════════ */
function ConversationView({
  chatId, currentUserId, currentUserName, otherUser, onBack,
}: {
  chatId: string; currentUserId: string; currentUserName: string;
  otherUser: { id: string; name: string; photo?: string }; onBack: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevCountRef = useRef(-1);
  const { play } = useNotificationSound();

  useEffect(() => {
    const unsub = subscribeToMessages(chatId, (msgs) => {
      if (prevCountRef.current >= 0 && msgs.length > prevCountRef.current) {
        const last = msgs[msgs.length - 1];
        if (last && last.senderId !== currentUserId) play();
      }
      prevCountRef.current = msgs.length;
      setMessages(msgs);
    });
    markMessagesAsRead(chatId, currentUserId);
    return () => unsub();
  }, [chatId, currentUserId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try { await sendMessage(chatId, currentUserId, currentUserName, text, otherUser.id); setText(''); }
    finally { setSending(false); }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || sending) return;
    setSending(true);
    try {
      const path = `chat_images/${chatId}/${Date.now()}_${file.name}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      await sendMessage(chatId, currentUserId, currentUserName, `[img]${url}`, otherUser.id);
    } finally { setSending(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  return (
    <div className="fc-conversation">
      <div className="fc-conv-header">
        <button className="fc-back-btn" onClick={onBack}><BackIcon /></button>
        <Avatar name={otherUser.name} photo={otherUser.photo} size={34} />
        <span className="fc-conv-name">{otherUser.name}</span>
      </div>
      <div className="fc-messages">
        {messages.length === 0 && (
          <div className="fc-empty">Inicia la conversación con {otherUser.name}</div>
        )}
        {messages.map((msg) => {
          const mine = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`fc-bubble-row ${mine ? 'mine' : 'theirs'}`}>
              {!mine && <Avatar name={otherUser.name} photo={otherUser.photo} size={26} />}
              <div className={`fc-bubble ${mine ? 'fc-mine' : 'fc-theirs'}`}>
                {msg.text.startsWith('[img]')
                  ? <img src={msg.text.slice(5)} alt="img" className="fc-bubble-img" />
                  : <span className="fc-bubble-text">{msg.text}</span>}
                <span className="fc-bubble-meta">
                  {formatTime(msg.timestamp)}{mine && <CheckIcon />}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="fc-input-bar">
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
        <button className="fc-img-btn" onClick={() => fileInputRef.current?.click()} disabled={sending}><ImageIcon /></button>
        <textarea className="fc-input" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey} placeholder="Escribe un mensaje..." rows={1} />
        <button className={`fc-send-btn ${text.trim() ? 'active' : ''}`} onClick={handleSend} disabled={!text.trim() || sending}>
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB: New chat picker
═══════════════════════════════════════════ */
function NewChatPicker({
  currentUserId, currentUserName, currentUserAvatar,
  onSelect, onClose,
}: {
  currentUserId: string; currentUserName: string; currentUserAvatar: string;
  onSelect: (chatId: string, other: { id: string; name: string; photo?: string }) => void;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers().then((all) => { setUsers(all.filter((u) => u.id !== currentUserId)); setLoading(false); });
  }, [currentUserId]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const pick = async (u: UserData) => {
    const chatId = await getOrCreateChat(currentUserId, currentUserName, u.id, u.name, currentUserAvatar, u.avatar || '');
    onSelect(chatId, { id: u.id, name: u.name, photo: u.avatar });
    onClose();
  };

  return (
    <div className="fc-new-picker">
      <div className="fc-new-header">
        <button className="fc-back-btn" onClick={onClose}><BackIcon /></button>
        <span>Nuevo mensaje</span>
      </div>
      <div className="fc-search-bar"><SearchIcon />
        <input autoFocus placeholder="Buscar usuario..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="fc-new-list">
        {loading && <div className="fc-loading">Cargando...</div>}
        {!loading && filtered.length === 0 && <div className="fc-loading">Sin resultados</div>}
        {filtered.map((u) => (
          <button key={u.id} className="fc-new-item" onClick={() => pick(u)}>
            <Avatar name={u.name} photo={u.avatar} size={36} />
            <div className="fc-new-info">
              <span className="fc-new-name">{u.name}</span>
              <span className="fc-new-sub">@{u.username} · {u.role}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN: FloatingChat
═══════════════════════════════════════════ */
const FloatingChat: React.FC<FloatingChatProps> = ({ currentUser, unreadCount, onUnreadChange }) => {
  /* Modal state: 'closed' | 'list' | 'conversation' | 'new' */
  const [modalState, setModalState] = useState<'closed' | 'list' | 'conversation' | 'new'>('closed');
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [search, setSearch] = useState('');
  const [activeChat, setActiveChat] = useState<{ chatId: string; otherUser: { id: string; name: string; photo?: string } } | null>(null);

  /* Bubble drag */
  const [bubblePos, setBubblePos] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
  const [dragging, setDragging] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [animate, setAnimate] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(-1);
  const { play } = useNotificationSound();

  const currentUserId = currentUser.id || currentUser.username;
  const currentUserAvatar = currentUser.profilePhoto || currentUser.avatar || '';

  /* ── Burbuja oculta por defecto; aparece cuando llega un mensaje nuevo ── */
  const [bubbleVisible, setBubbleVisible] = useState(false);

  /* Suscripción a chats */
  useEffect(() => {
    if (!currentUserId) return;
    const unsub = subscribeToUserChats(currentUserId, (updated) => {
      const total = updated.reduce((s, c) => s + (c.unreadCount?.[currentUserId] || 0), 0);
      if (prevUnreadRef.current >= 0 && total > prevUnreadRef.current) {
        play();
        setAnimate(true);
        setBubbleVisible(true);
        setTimeout(() => setAnimate(false), 900);
      }
      prevUnreadRef.current = total;
      setChats(updated);
      onUnreadChange?.(total);
    });
    return () => unsub();
  }, [currentUserId]);

  /* ── Drag (touch + mouse) ── */
  const BUBBLE_SIZE = 58;
  const TRASH_SIZE = 52;
  const TRASH_BOTTOM = 48;

  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    dragOffset.current = { x: clientX - rect.left, y: clientY - rect.top };
    setDragging(true);
    setShowTrash(true);
  }, []);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return;
    const nx = Math.max(0, Math.min(window.innerWidth - BUBBLE_SIZE, clientX - dragOffset.current.x));
    const ny = Math.max(0, Math.min(window.innerHeight - BUBBLE_SIZE, clientY - dragOffset.current.y));
    setBubblePos({ x: nx, y: ny });

    /* Detectar si está sobre el ícono de basura */
    const trashX = window.innerWidth / 2 - TRASH_SIZE / 2;
    const trashY = window.innerHeight - TRASH_BOTTOM - TRASH_SIZE;
    const cx = nx + BUBBLE_SIZE / 2;
    const cy = ny + BUBBLE_SIZE / 2;
    const overX = cx > trashX - 10 && cx < trashX + TRASH_SIZE + 10;
    const overY = cy > trashY - 10 && cy < trashY + TRASH_SIZE + 10;
    setOverTrash(overX && overY);
  }, [dragging]);

  const endDrag = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    setShowTrash(false);
    if (overTrash) {
      /* Cerrar burbuja */
      setOverTrash(false);
      setModalState('closed');
      setBubbleVisible(false);
      setBubblePos({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
      return;
    }
    setOverTrash(false);
    /* Snap al borde más cercano */
    const cx = bubblePos.x + BUBBLE_SIZE / 2;
    const snapX = cx < window.innerWidth / 2 ? 8 : window.innerWidth - BUBBLE_SIZE - 8;
    setBubblePos((p) => ({ x: snapX, y: p.y }));
  }, [dragging, overTrash, bubblePos]);

  /* mouse */
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onUp = () => endDrag();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, moveDrag, endDrag]);

  /* touch */
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  };
  const onTouchEnd = () => endDrag();

  /* ── Chat list helpers ── */
  const totalUnread = chats.reduce((s, c) => s + (c.unreadCount?.[currentUserId] || 0), 0);
  const filteredChats = chats.filter((chat) => {
    const oid = chat.participants.find((p) => p !== currentUserId) || '';
    return (chat.participantNames?.[oid] || '').toLowerCase().includes(search.toLowerCase());
  });

  const openChat = (chat: ChatRoom) => {
    const oid = chat.participants.find((p) => p !== currentUserId) || '';
    setActiveChat({
      chatId: chat.id,
      otherUser: { id: oid, name: chat.participantNames?.[oid] || 'Usuario', photo: chat.participantAvatars?.[oid] },
    });
    setModalState('conversation');
  };

  if (!bubbleVisible) return null;

  return (
    <>
      {/* ── Burbuja flotante ── */}
      <div
        ref={bubbleRef}
        className={`fc-bubble-btn ${dragging ? 'fc-dragging' : ''} ${animate ? 'fc-bubble-bounce' : ''} ${overTrash ? 'fc-bubble-over-trash' : ''}`}
        style={{ left: bubblePos.x, top: bubblePos.y }}
        onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (!dragging) setModalState(modalState === 'closed' ? 'list' : 'closed'); }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {totalUnread > 0 && (
          <span className={`fc-bubble-badge ${animate ? 'fc-badge-shake' : ''}`}>
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </div>

      {/* ── Ícono de papelera / cerrar (aparece al arrastrar) ── */}
      {showTrash && (
        <div ref={trashRef} className={`fc-trash-zone ${overTrash ? 'fc-trash-active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      )}

      {/* ── Modal panel ── */}
      {modalState !== 'closed' && (
        <div className="fc-modal-overlay" onClick={() => setModalState('closed')}>
          <div className="fc-modal" onClick={(e) => e.stopPropagation()}>

            {/* ── LISTA DE CHATS ── */}
            {modalState === 'list' && (
              <div className="fc-list-panel">
                <div className="fc-list-header">
                  <span className="fc-list-title">Mensajes {totalUnread > 0 && <span className="fc-title-badge">{totalUnread}</span>}</span>
                  <button className="fc-close-btn" onClick={() => { setModalState('closed'); setBubbleVisible(false); }} title="Cerrar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="fc-search-bar"><SearchIcon />
                  <input placeholder="Buscar conversación..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="fc-chat-list">
                  {filteredChats.length === 0 && (
                    <div className="fc-empty-list">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <p>No hay conversaciones aún</p>
                      <button className="fc-start-btn" onClick={() => setModalState('new')}>Iniciar chat</button>
                    </div>
                  )}
                  {filteredChats.map((chat) => {
                    const oid = chat.participants.find((p) => p !== currentUserId) || '';
                    const oName = chat.participantNames?.[oid] || 'Usuario';
                    const oPhoto = chat.participantAvatars?.[oid];
                    const unread = chat.unreadCount?.[currentUserId] || 0;
                    const ismine = chat.lastMessageSenderId === currentUserId;
                    return (
                      <button key={chat.id} className="fc-chat-item" onClick={() => openChat(chat)}>
                        <div className="fc-chat-avatar">
                          <Avatar name={oName} photo={oPhoto} size={44} />
                          {unread > 0 && <span className="fc-chat-unread">{unread > 99 ? '99+' : unread}</span>}
                        </div>
                        <div className="fc-chat-info">
                          <div className="fc-chat-row">
                            <span className="fc-chat-name">{oName}</span>
                            <span className="fc-chat-time">{formatTime(chat.lastMessageTime)}</span>
                          </div>
                          <div className="fc-chat-row">
                            <span className={`fc-chat-preview ${unread > 0 ? 'fc-unread' : ''}`}>
                              {ismine && <span className="fc-you">Tú: </span>}
                              {chat.lastMessage || 'Inicia la conversación'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── CONVERSACIÓN ── */}
            {modalState === 'conversation' && activeChat && (
              <ConversationView
                chatId={activeChat.chatId}
                currentUserId={currentUserId}
                currentUserName={currentUser.name}
                otherUser={activeChat.otherUser}
                onBack={() => setModalState('list')}
              />
            )}

            {/* ── NUEVO CHAT ── */}
            {modalState === 'new' && (
              <NewChatPicker
                currentUserId={currentUserId}
                currentUserName={currentUser.name}
                currentUserAvatar={currentUserAvatar}
                onSelect={(chatId, other) => { setActiveChat({ chatId, otherUser: other }); setModalState('conversation'); }}
                onClose={() => setModalState('list')}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
