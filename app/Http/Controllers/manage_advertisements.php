<?php

namespace App\Http\Controllers;

use App\Models\advertisements_images_model;
use App\Models\advertisements_model;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class manage_advertisements extends Controller
{
    private function findAd($id): advertisements_model
    {
        $ad = advertisements_model::with(['images', 'user', 'category'])->find($id);

        if (!$ad) {
            abort(404, 'Объявление не найдено');
        }

        return $ad;
    }

    public function edit($id)
    {
        $ad = $this->findAd($id);

        return response()->json([
            'success' => true,
            'ad'      => $ad->toFrontendArray(),
            'item'    => $ad->toFrontendArray(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $ad = $this->findAd($id);

        $request->validate([
            'title'       => 'nullable|string|max:255',
            'category'    => 'nullable',
            'category_id' => 'nullable',
            'price'       => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'address'     => 'nullable|string|max:255',
            'dorm'        => 'nullable|string|max:255',
            'number'      => 'nullable|string|max:30',
            'status'      => 'nullable|string|max:20',
            'offer_type'  => 'nullable|string|max:20',
            'condition'   => 'nullable|string|max:20',
            'images'      => 'nullable',
            'images.*'    => 'nullable|file|image|max:10240',
        ]);

        $updateData = [];

        if ($request->filled('title')) {
            $updateData['title'] = trim($request->input('title'));
        }
        if ($request->filled('description')) {
            $updateData['description'] = $request->input('description');
        }
        if ($request->filled('price')) {
            $updateData['price'] = (float) $request->input('price');
        }
        if ($request->filled('status')) {
            $updateData['status'] = $request->input('status');
        }
        if ($request->filled('address') || $request->filled('dorm')) {
            $updateData['address'] = $request->input('address') ?? $request->input('dorm');
        }
        if ($request->filled('number') || $request->filled('phone')) {
            $updateData['number'] = $request->input('number') ?? $request->input('phone');
        }
        if ($request->filled('offer_type') || $request->filled('offerType')) {
            $updateData['offer_type'] = $request->input('offer_type') ?? $request->input('offerType');
        }
        if ($request->filled('condition')) {
            $updateData['condition'] = $request->input('condition');
        }

        $catInput = $request->input('category_id') ?? $request->input('category');
        if ($catInput) {
            if (is_numeric($catInput)) {
                $updateData['category_id'] = (int) $catInput;
            } else {
                $c = Category::where('name', $catInput)->first();
                if ($c) {
                    $updateData['category_id'] = $c->category_id;
                }
            }
        }

        if (!empty($updateData)) {
            $ad->update($updateData);
        }

        if ($request->has('delete_images')) {
            $toDelete = (array) $request->input('delete_images');
            $imgs = advertisements_images_model::where('advertisements_id', $ad->advertisements_id)
                ->whereIn('image_id', $toDelete)
                ->get();

            foreach ($imgs as $img) {
                $relative = str_replace(['storage/', '/storage/'], '', $img->image_url);
                Storage::disk('public')->delete($relative);
                $img->delete();
            }
        }

        $newFiles = [];
        if ($request->hasFile('images')) {
            $files = $request->file('images');
            $newFiles = is_array($files) ? $files : [$files];
        } elseif ($request->hasFile('image')) {
            $newFiles = [$request->file('image')];
        }

        foreach ($newFiles as $file) {
            if ($file && $file->isValid()) {
                $savedPath = $file->store('ads', 'public');
                advertisements_images_model::create([
                    'advertisements_id' => $ad->advertisements_id,
                    'category_id'       => $ad->category_id,
                    'image_url'         => 'storage/' . $savedPath,
                    'is_main'           => false,
                ]);
            }
        }

        // Синхронизация главной картинки
        $images = advertisements_images_model::where('advertisements_id', $ad->advertisements_id)
            ->orderByDesc('is_main')
            ->orderBy('image_id')
            ->get();

        foreach ($images as $i => $img) {
            $img->is_main = ($i === 0);
            $img->category_id = $ad->category_id;
            $img->save();
        }

        $ad->refresh();
        $ad->load(['images', 'user', 'category']);

        return response()->json([
            'success' => true,
            'message' => 'Объявление успешно обновлено',
            'ad'      => $ad->toFrontendArray(),
            'item'    => $ad->toFrontendArray(),
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $ad = $this->findAd($id);

        $request->validate([
            'status' => 'required|string|max:20',
        ]);

        $ad->update([
            'status' => $request->input('status'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Статус объявления обновлен',
            'status'  => $ad->status,
            'ad'      => $ad->toFrontendArray(),
        ]);
    }

    public function destroy($id)
    {
        $ad = $this->findAd($id);

        foreach ($ad->images as $image) {
            $relative = str_replace(['storage/', '/storage/'], '', $image->image_url);
            Storage::disk('public')->delete($relative);
        }

        advertisements_images_model::where('advertisements_id', $ad->advertisements_id)->delete();
        $ad->delete();

        return response()->json([
            'success' => true,
            'message' => 'Объявление успешно удалено',
            'id'      => (int) $id,
        ]);
    }
}
