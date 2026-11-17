import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useListingsData } from '../context/ListingsContext';
import { money } from '../utils/format';
import { timeAgo } from '../utils/date';
import type { Listing, Status } from '../types';

const BADGE: Record<string, [string, string]> = {
  available:  ['АКТИВНО',   'badge--active'],
  active:     ['АКТИВНО',   'badge--active'],
  bookable:   ['ДОСТУПНО',  'badge--active'],
  reserved:   ['БРОНЬ',     'badge--hold'],
  moderation: ['МОДЕРАЦИЯ', 'badge--mod'],
  sold:       ['ПРОДАНО',   'badge--sold'],
  draft:      ['ЧЕРНОВИК',  'badge--sold'],
};

export default function MyNoticesPage() {
  const { user, isAuthenticated } = useAuth();
  const { mine, updateStatus, remove } = useListingsData();
  const nav = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'other'>('all');

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto' }}>
        <nav className="crumbs"><Link to="/">Каталог</Link> / Мои объявления</nav>
        <section className="panel" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h2>Раздел «Мои объявления»</h2>
          <p className="muted" style={{ maxWidth: '440px', margin: '12px auto 24px' }}>
            Для просмотра, редактирования и публикации ваших объявлений необходимо войти в систему.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <a href="/" className="btn btn--green">Перейти ко входу</a>
          </div>
        </section>
      </div>
    );
  }

  const filtered = mine.filter((l) => {
    if (filter === 'active') return l.status === 'available' || l.status === 'bookable';
    if (filter === 'draft') return l.status === 'draft' || l.status === 'moderation';
    if (filter === 'other') return l.status === 'sold' || l.status === 'reserved';
    return true;
  });

  return (
    <>
      <nav className="crumbs">
        <Link to="/">Каталог</Link> / <b>Мои объявления</b>
      </nav>

      <div className="card__row" style={{ alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>
            Мои объявления <small style={{ fontSize: '16px', fontWeight: 400, color: '#666' }}>({mine.length})</small>
          </h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Автор: <b>{user?.username}</b> ({user?.email}) · Управление через <code>manage_advertisements.php</code>
          </p>
        </div>
        <Link to="/profile/new" className="btn btn--green">+ Подать объявление</Link>
      </div>

      <div className="chips" style={{ marginBottom: '20px' }}>
        <button
          className={`chip-btn ${filter === 'all' ? 'is-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все ({mine.length})
        </button>
        <button
          className={`chip-btn ${filter === 'active' ? 'is-active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Активные ({mine.filter((m) => m.status === 'available' || m.status === 'bookable').length})
        </button>
        <button
          className={`chip-btn ${filter === 'draft' ? 'is-active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          Черновики и модерация ({mine.filter((m) => m.status === 'draft' || m.status === 'moderation').length})
        </button>
        <button
          className={`chip-btn ${filter === 'other' ? 'is-active' : ''}`}
          onClick={() => setFilter('other')}
        >
          Бронь и продано ({mine.filter((m) => m.status === 'reserved' || m.status === 'sold').length})
        </button>
      </div>

      {!filtered.length ? (
        <section className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
          <h3>В этой категории пока нет объявлений</h3>
          <p className="muted">Вы можете разместить товар или услугу прямо сейчас.</p>
          <Link to="/profile/new" className="btn btn--green" style={{ marginTop: '16px' }}>
            + Подать объявление
          </Link>
        </section>
      ) : (
        <div className="ml-list">
          {filtered.map((l: Listing) => {
            const [label, cls] = BADGE[l.status] || ['АКТИВНО', 'badge--active'];
            const editable = l.status !== 'sold';

            return (
              <article key={l.id} className="ml-card">
                <div className="ml-card__img">
                  {l.image ? <img src={l.image} alt={l.title} /> : '📦'}
                  <span className={`badge ${cls}`}>{label}</span>
                </div>
                <div className="ml-card__main">
                  <div className="card__row">
                    <Link to={`/listing/${l.id}`} className="plain">
                      <h3 className="card__title">{l.title}</h3>
                    </Link>
                    <strong className="price">
                      {l.price === 0 ? '0 ₽' : money(l.price)}
                    </strong>
                  </div>
                  <p className="muted">{l.description || '—'}</p>
                  <small className="muted">
                    {l.dorm ? l.dorm.split(' (')[0] : 'Кампус ТПУ'} · обновлено {timeAgo(l.createdAt)}
                  </small>
                  <div className="ml-card__actions" style={{ marginTop: '12px' }}>
                    {editable && (
                      <button
                        className="btn btn--ghost"
                        onClick={() => nav(`/profile/new?edit=${l.id}`)}
                      >
                        Редактировать
                      </button>
                    )}
                    {l.status === 'draft' && (
                      <button
                        className="btn btn--green"
                        onClick={() => updateStatus(l.id, 'moderation')}
                      >
                        Отправить на модерацию
                      </button>
                    )}
                    {l.status === 'moderation' && (
                      <>
                        <button
                          className="btn btn--green"
                          onClick={() => updateStatus(l.id, 'available')}
                        >
                          Опубликовать
                        </button>
                        <button
                          className="btn btn--ghost"
                          onClick={() => updateStatus(l.id, 'draft')}
                        >
                          В черновики
                        </button>
                      </>
                    )}
                    {l.status === 'available' && (
                      <button
                        className="btn btn--ghost"
                        onClick={() => updateStatus(l.id, 'draft')}
                      >
                        Снять с публикации
                      </button>
                    )}
                    {l.status === 'reserved' && (
                      <button
                        className="btn btn--ghost"
                        onClick={() => updateStatus(l.id, 'available')}
                      >
                        Отменить бронь
                      </button>
                    )}
                    <button
                      className="link link--danger"
                      onClick={() => {
                        if (confirm(`Удалить объявление "${l.title}"?`)) {
                          remove(l.id);
                        }
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
