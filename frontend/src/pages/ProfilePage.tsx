import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CURRENT_USER } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoriteContext';
import { useListingsData } from '../context/ListingsContext';
import { ListingCard } from '../components/ListingCard';
import { MyListingsTab } from '../components/MyListingsTab';
import { OrdersTab } from '../components/OrdersTab';

type Tab = 'overview' | 'listings' | 'orders' | 'favorites' | 'settings';
const NAV: [Tab, string][] = [
  ['overview', 'Главное'],
  ['listings', 'Мои объявления'],
  ['orders', 'Заказы и бронирования'],
  ['favorites', 'Избранное'],
  ['settings', 'Настройки профиля'],
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const paramTab = params.get('tab') as Tab;
  const validTabs: Tab[] = ['overview', 'listings', 'orders', 'favorites', 'settings'];
  const [tab, setTab] = useState<Tab>(validTabs.includes(paramTab) ? paramTab : 'overview');

  const fav = useFavorites();
  const { mine } = useListingsData();
  const active = mine.filter((m) => m.status === 'available' || m.status === 'bookable' || m.status === 'active').length;
  const holds = mine.filter((m) => m.status === 'reserved').length;

  const displayName = user ? user.username : CURRENT_USER.name;
  const displayEmail = user ? user.email : 'sokolov@tpu.ru';

  const selectTab = (t: Tab) => {
    setTab(t);
    setParams({ tab: t });
  };

  return (
    <>
      <nav className="crumbs"><Link to="/">Каталог</Link> / Личный кабинет</nav>
      <div className="profile">
        <aside className="profile__nav">
          <div className="profile__me">
            <i className="avatar avatar--lg">{(displayName[0] || 'П').toUpperCase()}</i>
            <div>
              <strong>{displayName}</strong>
              <br />
              <small>{displayEmail} · {CURRENT_USER.dorm}</small>
            </div>
          </div>
          <div className="profile__stats">
            <span><b>4.85</b><small>рейтинг</small></span>
            <span><b>14</b><small>сделок</small></span>
            <span><b>{active}</b><small>активных</small></span>
            <span><b>{holds}</b><small>бронь</small></span>
          </div>
          <nav>
            {NAV.map(([v, l]) => (
              <button
                key={v}
                className={tab === v ? 'is-active' : ''}
                onClick={() => selectTab(v)}
              >
                {l}
                {v === 'favorites' && ` (${fav.items.length})`}
                {v === 'listings' && ` (${mine.length})`}
              </button>
            ))}
          </nav>

          <button
            className="btn btn--ghost"
            onClick={() => logout()}
            style={{ marginTop: '16px', color: '#c5221f' }}
          >
            Выйти из аккаунта
          </button>
        </aside>

        <section className="profile__content">
          {tab === 'overview' && (
            <div className="panel">
              <h2>Обзор профиля</h2>
              <p className="muted">
                Авторизованный пользователь: <b>{user?.username}</b> ({user?.email}) · ID в базе: {user?.user_id}
              </p>
              <div className="profile__quick">
                <button className="btn btn--ghost" onClick={() => selectTab('orders')}>
                  Заказы и брони
                </button>
                <button className="btn btn--ghost" onClick={() => selectTab('favorites')}>
                  Избранное ({fav.items.length})
                </button>
                <button className="btn btn--ghost" onClick={() => logout()}>
                  Выйти
                </button>
              </div>
            </div>
          )}

          {tab === 'listings' && <MyListingsTab />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'favorites' && (
            fav.items.length ? (
              <div className="grid">
                {fav.items.map((l) => (
                  <ListingCard key={l.id} l={l} />
                ))}
              </div>
            ) : (
              <p className="state">В избранном пусто.</p>
            )
          )}

          {tab === 'settings' && (
            <div className="panel form">
              <h2>Настройки профиля</h2>
              <label className="field">Имя<input defaultValue={displayName} /></label>
              <label className="field">Общежитие<select defaultValue={CURRENT_USER.dorm}><option>{CURRENT_USER.dorm}</option></select></label>
              <label className="field">Комната<input defaultValue={CURRENT_USER.room} /></label>
              <button className="btn btn--green" onClick={() => alert('Сохранено')}>Сохранить</button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
