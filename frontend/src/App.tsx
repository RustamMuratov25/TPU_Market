import { Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CartPage } from './pages/CartPage';
import FavoritesPage from './pages/FavoritePage';
import { Layout } from './components/Layout';
import CatalogPage from './pages/CatalogPage';
import ListingPage from './pages/ListingPage';
import CreateListingPage from './pages/CreateListingPage';
import ProfilePage from './pages/ProfilePage';
import ChatsPage from './pages/ChatsPage'; 
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import MyNoticesPage from './pages/MyNoticesPage';

function CartRoute() {
  const nav = useNavigate();
  return <CartPage onBack={() => nav('/')} />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  // При первом заходе на сайт пользователь видит страницу входа
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CatalogPage />} />
        <Route path="cart" element={<CartRoute />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="listing/:id" element={<ListingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/new" element={<CreateListingPage />} />

        {/* Мои объявления (mynotices.php) */}
        <Route path="my_notices" element={<MyNoticesPage />} />
        <Route path="my-notices" element={<MyNoticesPage />} />
        <Route path="mynotices" element={<MyNoticesPage />} />

        {/* Обратная совместимость с путями */}
        <Route path="glavnaya" element={<Navigate to="/" replace />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="login" element={<Navigate to="/" replace />} />
        <Route path="register" element={<Navigate to="/" replace />} />
        <Route path="registr" element={<Navigate to="/" replace />} />

        <Route path="*" element={<p className="state">Страница не найдена</p>} />
      </Route>
    </Routes>
  );
}
