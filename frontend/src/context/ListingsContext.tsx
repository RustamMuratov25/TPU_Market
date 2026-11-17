import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CURRENT_USER, MOCK } from '../data/mock';
import type { Listing, NewListingInput, Status } from '../types';
import { useNotifications } from './NotificationsContext';
import { useAuth } from './AuthContext';

interface Delta { created: Listing[]; removedIds: number[] }
interface ListingsCtx {
  all: Listing[];
  mine: Listing[];
  add: (input: NewListingInput, file?: File | null) => Promise<number>;
  update: (id: number, patch: Partial<Listing>) => Promise<void>;
  updateStatus: (id: number, status: Status) => Promise<void>;
  remove: (id: number) => Promise<void>;
  get: (id: number) => Listing | undefined;
  refresh: () => Promise<void>;
  refreshMine: () => Promise<void>;
}

const Ctx = createContext<ListingsCtx | null>(null);
const KEY = 'studobmen.listingsDelta';

function loadDelta(): Delta {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{"created":[],"removedIds":[]}'); }
  catch { return { created: [], removedIds: [] }; }
}

export function ListingsProvider({ children }: { children: ReactNode }) {
  const notif = useNotifications();
  const { user, token } = useAuth();
  const [delta, setDelta] = useState<Delta>(loadDelta);
  const [backendItems, setBackendItems] = useState<Listing[]>([]);
  const [myBackendItems, setMyBackendItems] = useState<Listing[]>([]);

  // Загружаем общий список товаров (/api/products — block_with_tovar.php)
  const refresh = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          setBackendItems(data.items);
        }
      }
    } catch (err) {
      console.warn('Could not fetch items from /api/products:', err);
    }
  };

  // Загружаем «Мои объявления» (/api/my_notices — mynotices.php)
  const refreshMine = async () => {
    try {
      const url = user?.user_id ? `/api/my_notices?user_id=${user.user_id}` : '/api/my_notices';
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          setMyBackendItems(data.items);
        }
      }
    } catch (err) {
      console.warn('Could not fetch items from /api/my_notices:', err);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    refreshMine();
  }, [user, token]);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(delta)); } catch { /* noop */ }
  }, [delta]);

  const all = useMemo<Listing[]>(() => {
    const removed = new Set(delta.removedIds);
    const createdIds = new Set(delta.created.map((c) => c.id));
    const baseSource = backendItems.length > 0 ? backendItems : MOCK;
    const base = baseSource.filter((l) => !removed.has(l.id) && !createdIds.has(l.id));
    return [...delta.created, ...base];
  }, [backendItems, delta]);

  const mine = useMemo(() => {
    if (myBackendItems.length > 0) {
      const myIds = new Set(myBackendItems.map((m) => m.id));
      const newlyCreated = delta.created.filter((c) => !myIds.has(c.id));
      return [...newlyCreated, ...myBackendItems];
    }

    return all.filter((l) => {
      if (user) {
        return l.seller?.id === user.user_id || l.seller?.name === user.username;
      }
      return false;
    });
  }, [all, delta.created, myBackendItems, user]);

  const update = async (id: number, patch: Partial<Listing>) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/ads/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(patch),
      });
    } catch (e) {
      console.warn('API update failed:', e);
    }

    setDelta((d) => {
      if (d.created.some((c) => c.id === id))
        return { ...d, created: d.created.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
      const original = all.find((l) => l.id === id) || MOCK.find((l) => l.id === id);
      if (!original) return d;
      return { ...d, created: [{ ...original, ...patch, id }, ...d.created] };
    });

    await refreshMine();
  };

  const add = async (input: NewListingInput, file?: File | null): Promise<number> => {
    let createdAd: Listing | null = null;

    try {
      const fd = new FormData();
      fd.append('title', input.title);
      fd.append('description', input.description);
      fd.append('price', input.price.toString());
      fd.append('category', input.category);
      fd.append('dorm', input.dorm);
      fd.append('address', input.dorm);
      fd.append('offer_type', input.offerType);
      fd.append('condition', input.condition);
      fd.append('status', input.status);

      if (user?.user_id) {
        fd.append('user_id', user.user_id.toString());
      }

      if (file) {
        fd.append('images[]', file);
      }

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ads', {
        method: 'POST',
        headers,
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.item || data.ad) {
          createdAd = (data.item || data.ad) as Listing;
        }
      }
    } catch (err) {
      console.warn('API create advertisement failed, creating locally:', err);
    }

    const id = createdAd?.id || Date.now();
    const currentName = user ? user.username : CURRENT_USER.name;
    const listing: Listing = createdAd || {
      ...input,
      id,
      createdAt: Date.now(),
      seller: {
        id: user?.user_id,
        name: currentName,
        rating: 4.85,
        reviews: 14,
        institute: CURRENT_USER.institute,
      },
    };

    setDelta((d) => ({ ...d, created: [listing, ...d.created] }));

    notif.push({
      type: 'moderation',
      title: input.status === 'draft' ? 'Черновик сохранён' : 'Отправлено на модерацию',
      body: input.status === 'draft' ? 'Продолжите оформление в личном кабинете' : 'AI-проверка пройдена, студсовет на связи ~5 минут',
      link: '/my_notices',
      listingId: id,
    });

    await refresh();
    await refreshMine();

    return id;
  };

  const updateStatus = async (id: number, status: Status) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/ads/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.warn('API updateStatus failed:', e);
    }

    await update(id, { status });

    const map: Partial<Record<Status, [string, string]>> = {
      available:  ['Объявление активно', 'Прошло модерацию и видно покупателям в каталоге'],
      draft:      ['Снято с публикации', 'Возвращено в черновики'],
      moderation: ['Отправлено на модерацию', 'Проверка студсоветом, ~5 минут'],
      reserved:   ['Бронь установлена', 'Товар временно забронирован'],
      sold:       ['Товар продан', 'Сделка успешно завершена'],
    };
    const m = map[status];
    if (m) notif.push({ type: 'moderation', title: m[0], body: m[1], link: '/my_notices', listingId: id });
  };

  const remove = async (id: number) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/ads/${id}`, { method: 'DELETE', headers });
    } catch (e) {
      console.warn('API remove failed:', e);
    }

    setDelta((d) => d.created.some((c) => c.id === id)
      ? { ...d, created: d.created.filter((c) => c.id !== id) }
      : { ...d, removedIds: [...d.removedIds, id] });

    setMyBackendItems((items) => items.filter((item) => item.id !== id));

    notif.push({ type: 'system', title: 'Объявление удалено', body: 'Карточка больше не видна покупателям', link: '/my_notices' });

    await refresh();
  };

  const value: ListingsCtx = {
    all,
    mine,
    add,
    update,
    updateStatus,
    remove,
    get: (id) => all.find((l) => l.id === id),
    refresh,
    refreshMine,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useListingsData(): ListingsCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useListingsData must be used inside <ListingsProvider>');
  return c;
}
