import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useListingsData } from '../context/ListingsContext';
import { money } from '../utils/format';
import { timeAgo } from '../utils/date';
import type { Listing } from '../types';

const BADGE: Record<string, [string, string]> = {
  available:  ['АКТИВНО',   'badge--active'],
  active:     ['АКТИВНО',   'badge--active'],
  bookable:   ['ДОСТУПНО',  'badge--active'],
  reserved:   ['БРОНЬ',     'badge--hold'],
  moderation: ['МОДЕРАЦИЯ', 'badge--mod'],
  sold:       ['ПРОДАНО',   'badge--sold'],
  draft:      ['ЧЕРНОВИК',  'badge--sold'],
};

function Row({ l }: { l: Listing }) {
  const ctx = useListingsData();
  const nav = useNavigate();
  const [label, cls] = (l.status && BADGE[l.status]) || ['АКТИВНО', 'badge--active'];
  const editable = l.status !== 'sold';
  const dormText = l.dorm ? l.dorm.split(' (')[0] : 'Кампус ТПУ';
  const timeText = l.createdAt ? timeAgo(l.createdAt) : 'недавно';

  return (
    <article className="ml-card">
      <div className="ml-card__img">
        {l.image ? <img src={l.image} alt={l.title || ''} /> : '📦'}
        <span className={`badge ${cls}`}>{label}</span>
      </div>
      <div className="ml-card__main">
        <div className="card__row">
          <Link to={`/listing/${l.id}`} className="plain">
            <h3 className="card__title">{l.title}</h3>
          </Link>
          <strong className="price">{l.price === 0 ? '0 ₽' : money(l.price || 0)}</strong>
        </div>
        <p className="muted">{l.description || '—'}</p>
        <small className="muted">{dormText} · обновлено {timeText}</small>
        <div className="ml-card__actions" style={{ marginTop: '10px' }}>
          {editable && (
            <button className="btn btn--ghost" onClick={() => nav(`/profile/new?edit=${l.id}`)}>
              Редактировать
            </button>
          )}
          {l.status === 'draft' && (
            <button className="btn btn--green" onClick={() => ctx.updateStatus(l.id, 'moderation')}>
              Отправить на модерацию
            </button>
          )}
          {l.status === 'moderation' && (
            <>
              <button className="btn btn--green" onClick={() => ctx.updateStatus(l.id, 'available')}>
                Принять (демо)
              </button>
              <button className="btn btn--ghost" onClick={() => ctx.updateStatus(l.id, 'draft')}>
                Вернуть в черновики
              </button>
            </>
          )}
          {(l.status === 'available' || l.status === 'active') && (
            <button className="btn btn--ghost" onClick={() => ctx.updateStatus(l.id, 'draft')}>
              Снять с публикации
            </button>
          )}
          {l.status === 'reserved' && (
            <button className="btn btn--ghost" onClick={() => ctx.updateStatus(l.id, 'available')}>
              Отменить бронь
            </button>
          )}
          <button
            className="link link--danger"
            onClick={() => {
              if (confirm(`Удалить объявление "${l.title}"?`)) {
                ctx.remove(l.id);
              }
            }}
          >
            Удалить
          </button>
        </div>
      </div>
    </article>
  );
}

export function MyListingsTab() {
  const { mine } = useListingsData();
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'other'>('all');

  const filtered = mine.filter((l) => {
    if (filter === 'active') return l.status === 'available' || l.status === 'bookable' || l.status === 'active';
    if (filter === 'draft') return l.status === 'draft' || l.status === 'moderation';
    if (filter === 'other') return l.status === 'sold' || l.status === 'reserved';
    return true;
  });

  return (
    <div>
      <div className="card__row" style={{ alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Мои объявления ({mine.length})</h2>
        <Link to="/profile/new" className="btn btn--green">
          + Подать объявление
        </Link>
      </div>

      <div className="chips" style={{ marginBottom: '16px' }}>
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
          Активные ({mine.filter((m) => m.status === 'available' || m.status === 'bookable' || m.status === 'active').length})
        </button>
        <button
          className={`chip-btn ${filter === 'draft' ? 'is-active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          Черновики ({mine.filter((m) => m.status === 'draft' || m.status === 'moderation').length})
        </button>
        <button
          className={`chip-btn ${filter === 'other' ? 'is-active' : ''}`}
          onClick={() => setFilter('other')}
        >
          Бронь и архив ({mine.filter((m) => m.status === 'reserved' || m.status === 'sold').length})
        </button>
      </div>

      {!filtered.length ? (
        <div className="panel" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📦</div>
          <p className="state" style={{ margin: '8px 0' }}>
            {mine.length === 0 ? 'У вас пока нет объявлений.' : 'В этой вкладке нет объявлений.'}
          </p>
          <Link to="/profile/new" className="btn btn--green" style={{ marginTop: '12px' }}>
            + Подать объявление
          </Link>
        </div>
      ) : (
        <div className="ml-list">
          {filtered.map((l) => (
            <Row key={l.id} l={l} />
          ))}
        </div>
      )}
    </div>
  );
}
