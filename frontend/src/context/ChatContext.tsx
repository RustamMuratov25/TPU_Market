import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useListingsData } from './ListingsContext';
import { useNotifications } from './NotificationsContext';
import type { ChatMessage, ChatThread, Listing } from '../types';

interface ChatCtx {
  threads: ChatThread[];
  activeId: string | null;
  typingId: string | null;
  unread: number;
  openForListing: (l: Listing) => void;
  openByListingId: (id: number) => void;
  open: (threadId: string) => void;
  close: () => void;
  send: (threadId: string, text: string) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<ChatCtx | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { all } = useListingsData();
  const notif = useNotifications();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [typingId, setTypingId] = useState<string | null>(null);

  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  // Очищаем старые кэшированные мок-чаты из localStorage браузера
  useEffect(() => {
    try {
      localStorage.removeItem('studobmen.chats');
    } catch {
      /* noop */
    }
  }, []);

  // Загрузка тредов с сервера из таблицы messages
  const refresh = useCallback(async () => {
    try {
      const url = user?.user_id ? `/api/chats?user_id=${user.user_id}` : '/api/chats';
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.threads)) {
          setThreads((prev) => {
            // Объединяем с локально открытыми пустыми диалогами
            const serverIds = new Set(data.threads.map((t: ChatThread) => t.id));
            const localOnly = prev.filter((p) => !serverIds.has(p.id) && p.messages.length === 0);
            return [...data.threads, ...localOnly];
          });
        }
      }
    } catch (err) {
      console.warn('Не удалось обновить чаты с сервера:', err);
    }
  }, [user]);

  // Загружаем чаты при монтировании и смене пользователя
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Периодический опрос сервера для живого обновления сообщений каждые 4 секунды
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [user, refresh]);

  // Создать или найти тред по объявлению
  const ensureThread = useCallback((l: Listing): string => {
    const existing = threads.find((t) => t.listingId === l.id);
    if (existing) return existing.id;

    const sellerId = l.seller?.id || 1;
    const id = `ad_${l.id}_user_${sellerId}`;

    const t: ChatThread = {
      id,
      listingId: l.id,
      listingTitle: l.title,
      listingPrice: l.price,
      listingImage: l.image,
      sellerName: l.seller?.name || 'Пользователь ТПУ',
      sellerAvatar: (l.seller?.name?.[0] || 'П').toUpperCase(),
      otherUserId: sellerId,
      messages: [],
      updatedAt: Date.now(),
      unread: 0,
    };

    setThreads((p) => [t, ...p]);
    return id;
  }, [threads]);

  // Пометить тред прочитанным
  const markOpen = useCallback(async (id: string) => {
    setThreads((p) => p.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
    notif.markByThread(id);

    try {
      await fetch(`/api/chats/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: user?.user_id }),
      });
    } catch {
      /* noop */
    }
  }, [notif, user]);

  const open = useCallback((id: string) => {
    setActiveId(id);
    markOpen(id);
  }, [markOpen]);

  const openForListing = useCallback((l: Listing) => {
    const id = ensureThread(l);
    setActiveId(id);
    markOpen(id);
  }, [ensureThread, markOpen]);

  const openByListingId = useCallback((lid: number) => {
    const l = all.find((x) => x.id === lid);
    if (l) openForListing(l);
  }, [all, openForListing]);

  const close = useCallback(() => setActiveId(null), []);

  // Отправка сообщения в базу данных PostgreSQL
  const send = useCallback(async (threadId: string, text: string) => {
    const clean = text.trim();
    if (!clean) return;

    const targetThread = threads.find((t) => t.id === threadId);
    const now = Date.now();

    // 1. Оптимистично добавляем в локальное состояние
    const tempId = `temp_${now}`;
    const mine: ChatMessage = {
      id: tempId,
      author: 'me',
      text: clean,
      createdAt: now,
    };

    setThreads((p) =>
      p.map((t) =>
        t.id === threadId
          ? { ...t, messages: [...t.messages, mine], updatedAt: now }
          : t
      )
    );

    // 2. Сохраняем в таблицу messages в базе данных через API
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          threadId,
          advertisements_id: targetThread?.listingId,
          receiver_id: targetThread?.otherUserId,
          message_text: clean,
          user_id: user?.user_id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setThreads((p) =>
            p.map((t) =>
              t.id === threadId
                ? {
                    ...t,
                    messages: t.messages.map((m) =>
                      m.id === tempId ? data.message : m
                    ),
                  }
                : t
            )
          );
        }
      }
    } catch (e) {
      console.warn('Не удалось отправить сообщение на сервер:', e);
    }
  }, [threads, user]);

  const unread = threads.reduce((s, t) => s + t.unread, 0);

  const value: ChatCtx = {
    threads,
    activeId,
    typingId,
    unread,
    openForListing,
    openByListingId,
    open,
    close,
    send,
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChat(): ChatCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useChat must be used inside <ChatProvider>');
  return c;
}
