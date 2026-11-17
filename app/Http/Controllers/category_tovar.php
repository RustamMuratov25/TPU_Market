<?php

namespace App\Http\Controllers;

use App\Models\advertisements_model;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class category_tovar extends Controller
{
    public const CATEGORIES = [
        'posuda'       => 1,
        'kantselarya'  => 2,
        'tekstyle'     => 3,
        'peryferya'    => 4,
        'gadjet'       => 5,
        'merch'        => 6,
        'sport'        => 7,
        'nastolky'     => 8,
        'gameing'      => 9,
        'tvorchestvo'  => 10,
        'odejda'       => 11,
        'uchebniky'    => 12,
        'komplect'     => 13,
        'kursovye'     => 14,
        'technika'     => 15,
    ];

    public function getCategories()
    {
        $categories = Category::all();

        $slugs = array_flip(self::CATEGORIES);

        $result = $categories->map(function ($cat) use ($slugs) {
            return [
                'id'   => $cat->category_id,
                'name' => $cat->name,
                'slug' => $slugs[$cat->category_id] ?? 'cat-' . $cat->category_id,
            ];
        });

        return response()->json([
            'success'    => true,
            'categories' => $result,
        ]);
    }

    public function getByCategory($category, Request $request = null)
    {
        $isDark = str_ends_with($category, '2');
        $cleanCategory = $isDark ? substr($category, 0, -1) : $category;

        $categoryId = null;
        if (is_numeric($cleanCategory)) {
            $categoryId = (int) $cleanCategory;
        } elseif (isset(self::CATEGORIES[$cleanCategory])) {
            $categoryId = self::CATEGORIES[$cleanCategory];
        }

        if (!$categoryId) {
            return response()->json([
                'success' => false,
                'message' => 'Категория не найдена',
            ], 404);
        }

        $currentUserId = Auth::id() ?? session('user_id');

        $ads = advertisements_model::where('category_id', $categoryId)
            ->with(['images', 'user', 'category'])
            ->when($currentUserId && ($request && $request->boolean('exclude_own')), fn($q) => $q->where('user_id', '!=', $currentUserId))
            ->latest('advertisements_id')
            ->get();

        $formatted = $ads->map(fn($ad) => $ad->toFrontendArray());

        return response()->json([
            'success'     => true,
            'category_id' => $categoryId,
            'category'    => advertisements_model::CATEGORIES[$categoryId] ?? 'Категория ' . $categoryId,
            'items'       => $formatted,
            'total'       => $formatted->count(),
        ]);
    }

    public function __call($method, $parameters)
    {
        $request = request();
        return $this->getByCategory($method, $request);
    }
}
