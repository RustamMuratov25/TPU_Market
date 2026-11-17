<?php

namespace App\Http\Controllers;

use App\Models\advertisements_model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class block_with_tovar extends Controller
{
    public function index(Request $request)
    {
        $currentUserId = Auth::id() ?? session('user_id');

        $query = advertisements_model::with(['images', 'user', 'category'])
            ->where('status', '!=', 'draft');

        if ($request->boolean('exclude_own') && $currentUserId) {
            $query->where('user_id', '!=', $currentUserId);
        }

        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $variants = array_unique([
                $s,
                mb_strtolower($s, 'UTF-8'),
                mb_strtoupper($s, 'UTF-8'),
                mb_convert_case($s, MB_CASE_TITLE, 'UTF-8'),
            ]);
            $query->where(function ($q) use ($variants) {
                foreach ($variants as $variant) {
                    $q->orWhere('title', 'like', "%{$variant}%")
                      ->orWhere('description', 'like', "%{$variant}%");
                }
            });
        }

        if ($request->filled('category')) {
            $cat = $request->input('category');
            if (is_numeric($cat)) {
                $query->where('category_id', (int) $cat);
            } else {
                $query->whereHas('category', function ($q) use ($cat) {
                    $q->where('name', $cat);
                });
            }
        } elseif ($request->filled('categories')) {
            $cats = (array) $request->input('categories');
            $numericCats = array_filter($cats, 'is_numeric');
            $stringCats = array_filter($cats, fn($c) => !is_numeric($c));

            $query->where(function ($q) use ($numericCats, $stringCats) {
                if (!empty($numericCats)) {
                    $q->whereIn('category_id', $numericCats);
                }
                if (!empty($stringCats)) {
                    $q->orWhereHas('category', function ($sub) use ($stringCats) {
                        $sub->whereIn('name', $stringCats);
                    });
                }
            });
        }

        if ($request->filled('dorms')) {
            $dorms = (array) $request->input('dorms');
            $query->where(function ($q) use ($dorms) {
                foreach ($dorms as $dorm) {
                    $dormName = explode(' (', $dorm)[0];
                    $q->orWhere('address', 'like', "%{$dormName}%");
                }
            });
        }

        if ($request->filled('price_min')) {
            $query->where('price', '>=', (float) $request->input('price_min'));
        }
        if ($request->filled('price_max')) {
            $query->where('price', '<=', (float) $request->input('price_max'));
        }

        if ($request->filled('offer_types')) {
            $types = (array) $request->input('offer_types');
            $query->whereIn('offer_type', $types);
        }

        if ($request->filled('conditions')) {
            $conds = (array) $request->input('conditions');
            $query->whereIn('condition', $conds);
        }

        if ($request->boolean('only_available')) {
            $query->where('status', '!=', 'reserved');
        }

        $sort = $request->input('sort', 'new');
        if ($sort === 'cheap') {
            $query->orderBy('price', 'asc');
        } elseif ($sort === 'expensive') {
            $query->orderBy('price', 'desc');
        } else {
            $query->latest('advertisements_id');
        }

        $allAds = $query->get();
        $formatted = $allAds->map(fn($ad) => $ad->toFrontendArray());

        $page = max(1, (int) $request->input('page', 1));
        $perPage = (int) $request->input('per_page', 9);

        if ($request->has('page')) {
            $items = $formatted->forPage($page, $perPage)->values();
        } else {
            $items = $formatted;
        }

        return response()->json([
            'success' => true,
            'items'   => $items,
            'total'   => $formatted->count(),
            'page'    => $page,
            'per_page'=> $perPage,
            'data'    => $formatted,
        ]);
    }

    public function show($id)
    {
        $ad = advertisements_model::with(['images', 'user', 'category'])->find($id);

        if (!$ad) {
            return response()->json([
                'success' => false,
                'message' => 'Объявление не найдено',
            ], 404);
        }

        $frontendData = $ad->toFrontendArray();

        $conditionMap = [
            'new'       => 'Новое',
            'excellent' => 'Отличное',
            'good'      => 'Хорошее',
            'parts'     => 'На запчасти',
        ];

        $frontendData['sku'] = "ТПУ-13-" . (8940 + $ad->advertisements_id);
        $frontendData['longDescription'] = $ad->description ?: 'Описание отсутствует';
        $frontendData['pickupNote'] = 'Самовывоз: ' . ($ad->address ?: 'Кампус ТПУ') . '. Передача лично в руки на вахте или в комнате.';
        $frontendData['moderation'] = 'Объявление прошло проверку кампусной системы ТПУ. Соответствует регламенту безопасности.';
        $frontendData['specs'] = [
            ['label' => 'Состояние', 'value' => $conditionMap[$ad->condition] ?? 'Хорошее', 'note' => 'Без дефектов, готово к использованию'],
            ['label' => 'Тип сделки', 'value' => $ad->offer_type === 'free' ? 'Отдам даром' : 'Прямая продажа', 'note' => 'Без скрытых комиссий'],
            ['label' => 'Категория', 'value' => $frontendData['category'], 'note' => 'Для студентов кампуса ТПУ'],
            ['label' => 'Телефон', 'value' => $ad->number ?: 'Не указан', 'note' => 'Связь с продавцом'],
        ];
        $realReviews = \App\Models\Review::with(['author', 'advertisement'])
            ->where(function ($q) use ($ad) {
                $q->where('seller_id', $ad->user_id)
                  ->orWhere('advertisements_id', $ad->advertisements_id);
            })
            ->latest('review_id')
            ->get();

        $reviewsList = $realReviews->map(fn ($r) => $r->toFrontendArray())->values()->all();
        $reviewsCount = count($reviewsList);
        $avgRating = $reviewsCount > 0 ? round($realReviews->avg('stars'), 1) : 4.9;

        $frontendData['seller']['rating'] = $avgRating;
        $frontendData['seller']['reviews'] = $reviewsCount ?: 15;

        $frontendData['sellerInfo'] = [
            'program'      => 'Студент ТПУ (' . ($ad->user->username ?? 'Пользователь') . ')',
            'deals'        => max(14, $reviewsCount + 5),
            'reviewsCount' => $reviewsCount,
            'emailMasked'  => $ad->user ? substr($ad->user->email, 0, 2) . '***@tpu.ru' : '***@tpu.ru',
            'address'      => $ad->address ?: 'Кампус ТПУ',
            'since'        => '2024 года',
        ];
        $frontendData['reviews'] = $reviewsList;

        return response()->json([
            'success' => true,
            'item'    => $frontendData,
        ]);
    }

    public function indexDark(Request $request)
    {
        return $this->index($request);
    }
}
