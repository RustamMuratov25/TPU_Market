import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoriteContext';
import { useAuth } from '../context/AuthContext';
import { useListingsData } from '../context/ListingsContext';
import { NotificationBell } from './NotificationsBell';
import { ChatWidget } from './ChatWidget';
import { useChat } from '../context/ChatContext';

export function Layout() {
  const { user, logout } = useAuth();
  const { mine } = useListingsData();
  const chat = useChat();
  const cart = useCart();
  const favorites = useFavorites();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();

  const onSearch = (v: string) =>
    pathname === '/' ? setParams(v ? { q: v } : {}, { replace: true }) : nav(`/?q=${encodeURIComponent(v)}`);

  return (
    <>
      <header className="header">
        <div className="wrap header__in">
          <Link className="logo" to="/">
            <b>СТУДОБМЕН</b> <small>Маркетплейс общежитий</small>
          </Link>

          <input
            className="search"
            type="search"
            placeholder="Поиск вещей, книг, техники по кампусу..."
            value={params.get('q') ?? ''}
            onChange={(e) => onSearch(e.target.value)}
          />

          <Link className="btn btn--green" to="/profile/new">
            + Подать объявление
          </Link>

          <Link className="btn btn--ghost cart-btn" to="/favorites" aria-label="Избранное">
            ♥ {favorites.items.length}
          </Link>

          <Link className="btn btn--ghost cart-btn" to="/cart" aria-label="Корзина">
            🛒 {cart.items.length}
          </Link>

          <NotificationBell />

          <Link className="btn btn--ghost cart-btn" to="/chats" aria-label="Сообщения">
            💬 {chat.unread > 0 && <span className="bell__dot">{chat.unread}</span>}
          </Link>

          {user && (
            <Link className="user plain" to="/profile" title="Перейти в личный кабинет">
              <i className="avatar" style={{ width: '28px', height: '28px', fontSize: '13px' }}>
                {(user.username?.[0] || 'П').toUpperCase()}
              </i>
              <span>{user.username}</span>
            </Link>
          )}
        </div>
      </header>

      <main className="wrap">
        <Outlet />
      </main>

      <ChatWidget />

      <footer className="footer">
        <div className="wrap">
          © 2025 ТПУ Маркет. Создано студентами Томского политехнического университета.
        </div>
      </footer>
    </>
  );
}
