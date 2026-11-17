<?php

namespace App\Http\Controllers;

use App\Models\advertisements_model;
use Illuminate\Http\Request;

class search extends Controller
{
    public function search(Request $request)
    {
        $queryText = trim($request->input('search') ?? $request->input('q') ?? '');

        $adsQuery = advertisements_model::query()
            ->with(['images', 'user', 'category'])
            ->where('status', '!=', 'draft');

        if (!empty($queryText)) {
            $variants = array_unique([
                $queryText,
                mb_strtolower($queryText, 'UTF-8'),
                mb_strtoupper($queryText, 'UTF-8'),
                mb_convert_case($queryText, MB_CASE_TITLE, 'UTF-8'),
            ]);

            $adsQuery->where(function ($q) use ($variants) {
                foreach ($variants as $variant) {
                    $q->orWhere('title', 'like', "%{$variant}%")
                      ->orWhere('description', 'like', "%{$variant}%")
                      ->orWhere('address', 'like', "%{$variant}%");
                }
            });
        }

        if ($request->filled('category_id')) {
            $adsQuery->where('category_id', (int) $request->input('category_id'));
        }

        if ($request->filled('price_min')) {
            $adsQuery->where('price', '>=', (float) $request->input('price_min'));
        }
        if ($request->filled('price_max')) {
            $adsQuery->where('price', '<=', (float) $request->input('price_max'));
        }

        $sort = $request->input('sort', 'new');
        if ($sort === 'cheap') {
            $adsQuery->orderBy('price', 'asc');
        } elseif ($sort === 'expensive') {
            $adsQuery->orderBy('price', 'desc');
        } else {
            $adsQuery->latest('advertisements_id');
        }

        $ads = $adsQuery->get();
        $formatted = $ads->map(fn($ad) => $ad->toFrontendArray());

        return response()->json([
            'success' => true,
            'query'   => $queryText,
            'items'   => $formatted,
            'total'   => $formatted->count(),
            'data'    => $formatted,
        ]);
    }
}
