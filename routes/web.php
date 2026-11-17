<?php

use App\Http\Controllers\proverka_registr;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ReviewController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Главная страница: если пользователь не авторизован — показываем страницу входа registr.blade.php
Route::get('/', function () {
    if (Auth::check()) {
        return redirect('/glavnaya');
    }
    return response()->view('static1.registr')->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
})->name('registr');

// Обработка формы авторизации (POST из registr.blade.php)
Route::post('/registr', [proverka_registr::class, 'store'])->name('registr.store');

// Выход из системы
Route::get('/logout', [proverka_registr::class, 'logoutWeb'])->name('logout');
Route::post('/logout', [proverka_registr::class, 'logoutWeb']);

// Получение текущего авторизованного пользователя через web-сессию
Route::get('/api/me', [proverka_registr::class, 'me']);
Route::get('/api/user', [proverka_registr::class, 'me']);

// Чат и переписка между покупателем и продавцом
Route::get('/api/chats', [ChatController::class, 'threads']);
Route::get('/api/messages', [ChatController::class, 'threads']);
Route::post('/api/messages', [ChatController::class, 'sendMessage']);
Route::post('/api/chats/{threadId}/read', [ChatController::class, 'markRead']);

// Отзывы о товарах и продавцах
Route::get('/api/reviews', [ReviewController::class, 'index']);
Route::post('/api/reviews', [ReviewController::class, 'store']);

// Главная витрина маркетплейса (SPA)
Route::get('/glavnaya', function () {
    if (!Auth::check()) {
        return redirect()->route('registr');
    }
    $indexPath = public_path('index.html');
    return response()->file($indexPath, [
        'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
    ]);
})->name('home');

// Все остальные страницы SPA (каталог, мои объявления, профиль и т.д.)
Route::get('/{any}', function () {
    if (!Auth::check()) {
        return redirect()->route('registr');
    }
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath, [
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        ]);
    }
    return redirect()->route('registr');
})->where('any', '^(?!api|storage|images|assets).*$');
