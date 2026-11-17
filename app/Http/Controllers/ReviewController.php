<?php

namespace App\Http\Controllers;

use App\Models\advertisements_model;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Review::with(['author', 'advertisement'])->latest('review_id');

        if ($request->filled('seller_id')) {
            $query->where('seller_id', (int) $request->input('seller_id'));
        }

        if ($request->filled('advertisements_id') || $request->filled('listing_id')) {
            $adId = (int) ($request->input('advertisements_id') ?? $request->input('listing_id'));
            $query->where('advertisements_id', $adId);
        }

        $reviews = $query->get();
        $formatted = $reviews->map(fn ($r) => $r->toFrontendArray());

        $avg = $reviews->count() > 0 ? round($reviews->avg('stars'), 1) : 5.0;

        return response()->json([
            'success'        => true,
            'reviews'        => $formatted,
            'total'          => $formatted->count(),
            'average_rating' => $avg,
        ]);
    }

    public function store(Request $request)
    {
        $authorId = Auth::id() ?? session('user_id');
        if (!$authorId && $request->user()) {
            $authorId = $request->user()->user_id;
        }
        if (!$authorId && $request->filled('user_id')) {
            $authorId = (int) $request->input('user_id');
        }

        if (!$authorId) {
            return response()->json([
                'success' => false,
                'message' => 'Для написания отзыва необходимо войти в систему',
            ], 401);
        }

        $adId = (int) ($request->input('advertisements_id') ?? $request->input('listing_id') ?? 0);
        $ad = $adId ? advertisements_model::find($adId) : null;

        $sellerId = (int) ($request->input('seller_id') ?? ($ad ? $ad->user_id : 0));
        if (!$sellerId) {
            return response()->json([
                'success' => false,
                'message' => 'Не удалось определить продавца для отзыва',
            ], 422);
        }

        if ($authorId === $sellerId) {
            return response()->json([
                'success' => false,
                'message' => 'Вы не можете оставить отзыв на собственное объявление',
            ], 422);
        }

        $text = trim((string) $request->input('text', ''));
        if (mb_strlen($text, 'UTF-8') < 3) {
            return response()->json([
                'success' => false,
                'message' => 'Текст отзыва должен содержать не менее 3 символов',
            ], 422);
        }

        $stars = max(1, min(5, (int) $request->input('stars', 5)));

        $review = Review::create([
            'advertisements_id' => $adId ?: null,
            'seller_id'         => $sellerId,
            'author_id'         => $authorId,
            'stars'             => $stars,
            'text'              => $text,
            'created_at'        => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Отзыв успешно опубликован!',
            'review'  => $review->toFrontendArray(),
        ], 201);
    }
}
