<?php

namespace App\Http\Controllers;

use App\Models\advertisements_model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class mynotices extends Controller
{
    public function myNotices(Request $request)
    {
        $currentUserId = Auth::id() ?? session('user_id');

        if (!$currentUserId && $request->user()) {
            $currentUserId = $request->user()->user_id;
        }

        if (!$currentUserId && $request->filled('user_id')) {
            $currentUserId = (int)$request->input('user_id');
        }

        $query = advertisements_model::where('user_id', $currentUserId)
            ->with(['images', 'category', 'user'])
            ->latest('advertisements_id');

        if ($request->filled('search') || $request->filled('q')) {
            $s = trim($request->input('search') ?? $request->input('q'));
            $query->where('title', 'like', "%{$s}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $ads = $query->get();
        $formatted = $ads->map(fn($ad) => $ad->toFrontendArray());

        return response()->json([
            'success' => true,
            'user_id' => $currentUserId,
            'items'   => $formatted,
            'total'   => $formatted->count(),
            'data'    => $formatted,
        ]);
    }

    public function myNoticesDark(Request $request)
    {
        return $this->myNotices($request);
    }
}
