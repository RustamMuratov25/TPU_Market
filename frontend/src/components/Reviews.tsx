import { useState } from 'react';
import type { Review } from '../api/listingDetails';
import { useAuth } from '../context/AuthContext';

export function Reviews({
  seller,
  rating,
  reviews: initialReviews,
  listingId,
  sellerId,
}: {
  seller: string;
  rating: number;
  reviews: Review[];
  listingId?: number;
  sellerId?: number;
}) {
  const { user } = useAuth();
  const [list, setList] = useState<Review[]>(initialReviews || []);
  const [showForm, setShowForm] = useState(false);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isOwner = user && sellerId && user.user_id === sellerId;

  const currentRating = list.length > 0
    ? (list.reduce((acc, r) => acc + r.stars, 0) / list.length).toFixed(1)
    : rating.toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Пожалуйста, напишите текст отзыва');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          advertisements_id: listingId,
          seller_id: sellerId,
          stars,
          text: text.trim(),
          user_id: user?.user_id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.review) {
        setList([data.review, ...list]);
        setText('');
        setSuccess(true);
        setShowForm(false);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(data.message || 'Не удалось сохранить отзыв');
      }
    } catch (err: any) {
      setError('Ошибка сети: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel" style={{ marginTop: '20px' }}>
      <div className="card__row" style={{ alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0 }}>
            Отзывы о сделках с {seller ? seller.split(' ')[0] : 'продавцом'}
          </h2>
          <small className="muted">
            Репутация продавца в кампусе ТПУ · {list.length} отзывов
          </small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="tag tag--free" style={{ fontSize: '15px' }}>
            ★ {currentRating}
          </span>
          {!isOwner && !showForm && (
            <button
              className="btn btn--green"
              onClick={() => setShowForm(true)}
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              + Написать отзыв
            </button>
          )}
        </div>
      </div>

      {success && (
        <div style={{
          backgroundColor: '#e6f4ea',
          color: '#137333',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 500,
        }}>
          ✓ Спасибо! Ваш отзыв опубликован и сохранён в базе данных.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <strong style={{ fontSize: '15px' }}>Оставить отзыв о продавце</strong>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => { setShowForm(false); setError(null); }}
              style={{ padding: '4px 8px', fontSize: '12px' }}
            >
              ✕ Отмена
            </button>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fce8e6',
              color: '#c5221f',
              padding: '8px 12px',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#4b5563', marginBottom: '6px' }}>
              Оценка:
            </label>
            <div style={{ display: 'flex', gap: '6px', fontSize: '24px', cursor: 'pointer' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  onClick={() => setStars(s)}
                  style={{ color: s <= stars ? '#f59e0b' : '#d1d5db', transition: 'color 0.15s' }}
                  title={`${s} из 5`}
                >
                  ★
                </span>
              ))}
              <span style={{ fontSize: '14px', color: '#6b7280', alignSelf: 'center', marginLeft: '6px' }}>
                ({stars} из 5)
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#4b5563', marginBottom: '6px' }}>
              Ваш отзыв:
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Расскажите, как прошла сделка, состояние товара, встреча на вахте…"
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              className="btn btn--green"
              disabled={loading || !text.trim()}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              {loading ? 'Публикация…' : 'Опубликовать отзыв'}
            </button>
          </div>
        </form>
      )}

      {!list.length ? (
        <p className="muted" style={{ padding: '16px 0', textAlign: 'center' }}>
          У этого продавца пока нет отзывов. Вы можете оставить первый отзыв после покупки!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {list.map((r) => (
            <article key={r.id} className="review">
              <div className="card__row" style={{ alignItems: 'baseline' }}>
                <span>
                  <b>{r.author}</b> <small className="muted">{r.unit}</small>
                </span>
                <span style={{ color: '#f59e0b', fontSize: '14px' }}>
                  {'★'.repeat(r.stars)}
                </span>
              </div>
              <p style={{ margin: '6px 0 4px', fontSize: '14px', color: '#374151' }}>
                {r.text}
              </p>
              <small className="muted">{r.when} • {r.subject}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
