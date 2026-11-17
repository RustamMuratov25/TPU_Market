<?php

namespace App\Http\Controllers;

use App\Models\advertisements_images_model;
use App\Models\advertisements_model;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class create_advertisements extends Controller
{

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'price'       => 'required|numeric|min:0',
            'category'    => 'nullable',
            'category_id' => 'nullable',
            'description' => 'nullable|string',
            'address'     => 'nullable|string|max:255',
            'dorm'        => 'nullable|string|max:255',
            'number'      => 'nullable|string|max:30',
            'phone'       => 'nullable|string|max:30',
            'offerType'   => 'nullable|string|max:20',
            'offer_type'  => 'nullable|string|max:20',
            'condition'   => 'nullable|string|max:20',
            'status'      => 'nullable|string|max:20',
            'images'      => 'nullable',
            'images.*'    => 'nullable|file|image|max:10240',
            'image'       => 'nullable|file|image|max:10240',
        ]);

        $categoryId = $request->input('category_id') ?? $request->input('category') ?? 1;
        if (!is_numeric($categoryId)) {
            $cat = Category::where('name', $categoryId)->first();
            $categoryId = $cat ? $cat->category_id : 1;
        }

        $userId = Auth::id() ?? session('user_id');
        if (!$userId && $request->user()) {
            $userId = $request->user()->user_id;
        }
        if (!$userId && $request->filled('user_id')) {
            $userId = (int)$request->input('user_id');
        }
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Необходима авторизация для публикации объявления',
            ], 401);
        }

        $address = $request->input('address') ?? $request->input('dorm') ?? 'Общ. №13 (Вершинина, 33)';
        $phone = $request->input('number') ?? $request->input('phone') ?? '89224825191';
        $offerType = $request->input('offer_type') ?? $request->input('offerType') ?? ($request->input('price') == 0 ? 'free' : 'sale');
        $condition = $request->input('condition') ?? 'good';
        $status = $request->input('status') ?? 'active';

        $ad = advertisements_model::create([
            'user_id'     => $userId,
            'category_id' => (int) $categoryId,
            'title'       => trim($request->input('title')),
            'description' => $request->input('description') ?? '',
            'price'       => (float) $request->input('price'),
            'status'      => $status,
            'address'     => $address,
            'number'      => $phone,
            'offer_type'  => $offerType,
            'condition'   => $condition,
            'created_at'  => now(),
        ]);

        $uploadedFiles = [];
        if ($request->hasFile('images')) {
            $files = $request->file('images');
            $uploadedFiles = is_array($files) ? $files : [$files];
        } elseif ($request->hasFile('image')) {
            $uploadedFiles = [$request->file('image')];
        }

        foreach ($uploadedFiles as $index => $file) {
            if ($file && $file->isValid()) {
                $savedPath = $file->store('ads', 'public');

                advertisements_images_model::create([
                    'advertisements_id' => $ad->advertisements_id,
                    'category_id'       => $ad->category_id,
                    'image_url'         => 'storage/' . $savedPath,
                    'is_main'           => ($index === 0),
                ]);
            }
        }

        $ad->load(['images', 'user', 'category']);

        return response()->json([
            'success' => true,
            'message' => 'Объявление успешно создано',
            'ad'      => $ad->toFrontendArray(),
            'item'    => $ad->toFrontendArray(),
            'id'      => $ad->advertisements_id,
        ], 201);
    }
}
