<?php

use App\Http\Controllers\block_with_tovar;
use App\Http\Controllers\category_tovar;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\create_advertisements;
use App\Http\Controllers\manage_advertisements;
use App\Http\Controllers\mynotices;
use App\Http\Controllers\proverka_registr;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\search;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| REST API Routes for TPU Market
|--------------------------------------------------------------------------
|
| All routes in this file are automatically prefixed with /api
|
*/

// --- Авторизация и регистрация (proverka_registr) ---
Route::post('/register', [proverka_registr::class, 'register']);
Route::post('/registr', [proverka_registr::class, 'store']);
Route::post('/login', [proverka_registr::class, 'store']);
Route::get('/user', [proverka_registr::class, 'me']);
Route::get('/me', [proverka_registr::class, 'me']);
Route::post('/logout', [proverka_registr::class, 'logout']);

// --- Главная витрина товаров (block_with_tovar) ---
Route::get('/products', [block_with_tovar::class, 'index']);
Route::get('/products/{id}', [block_with_tovar::class, 'show'])->whereNumber('id');
Route::get('/glavnaya', [block_with_tovar::class, 'index']);
Route::get('/glavnaya2', [block_with_tovar::class, 'indexDark']);
Route::get('/ads', [block_with_tovar::class, 'index']);
Route::get('/ads/{id}', [block_with_tovar::class, 'show'])->whereNumber('id');

// --- Поиск товаров (search) ---
Route::get('/search', [search::class, 'search']);

// --- Категории товаров (category_tovar) ---
Route::get('/categories', [category_tovar::class, 'getCategories']);
Route::get('/categories/{category}', [category_tovar::class, 'getByCategory']);
Route::get('/category/{category}', [category_tovar::class, 'getByCategory']);

// Роуты для индивидуальных категорий
$categoriesList = [
    'posuda', 'kantselarya', 'tekstyle', 'peryferya', 'gadjet',
    'merch', 'sport', 'nastolky', 'gameing', 'tvorchestvo',
    'odejda', 'uchebniky', 'komplect', 'kursovye', 'technika'
];
foreach ($categoriesList as $catSlug) {
    Route::get('/' . $catSlug, [category_tovar::class, $catSlug]);
    Route::get('/' . $catSlug . '2', [category_tovar::class, $catSlug . '2']);
}

// --- Создание и управление объявлениями (create_advertisements, manage_advertisements) ---
Route::post('/ads', [create_advertisements::class, 'store']);
Route::post('/store-ad', [create_advertisements::class, 'store']);
Route::post('/store-ad-dark', [create_advertisements::class, 'store']);

Route::get('/ads/{id}/edit', [manage_advertisements::class, 'edit'])->whereNumber('id');
Route::put('/ads/{id}', [manage_advertisements::class, 'update'])->whereNumber('id');
Route::post('/ads/{id}', [manage_advertisements::class, 'update'])->whereNumber('id'); // для multipart/form-data
Route::patch('/ads/{id}/status', [manage_advertisements::class, 'updateStatus'])->whereNumber('id');
Route::delete('/ads/{id}', [manage_advertisements::class, 'destroy'])->whereNumber('id');

// --- Чат и сообщения между пользователями (ChatController) ---
Route::get('/chats', [ChatController::class, 'threads']);
Route::get('/messages', [ChatController::class, 'threads']);
Route::post('/messages', [ChatController::class, 'sendMessage']);
Route::post('/chats/{threadId}/read', [ChatController::class, 'markRead']);

// --- Отзывы о товарах и продавцах (ReviewController) ---
Route::get('/reviews', [ReviewController::class, 'index']);
Route::post('/reviews', [ReviewController::class, 'store']);

// --- Мои объявления (mynotices) ---
Route::get('/my-notices', [mynotices::class, 'myNotices']);
Route::get('/my_notices', [mynotices::class, 'myNotices']);
Route::get('/my_notices2', [mynotices::class, 'myNoticesDark']);
