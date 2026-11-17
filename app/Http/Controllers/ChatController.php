<?php

namespace App\Http\Controllers;

use App\Models\advertisements_model;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function threads(Request $request)
    {
        $userId = Auth::id() ?? session('user_id');
        if (!$userId && $request->user()) {
            $userId = $request->user()->user_id;
        }
        if (!$userId && $request->filled('user_id')) {
            $userId = (int)$request->input('user_id');
        }

        if (!$userId) {
            return response()->json([
                'success' => true,
                'threads' => [],
                'unread'  => 0,
            ]);
        }

        $messages = Message::with(['advertisement.images', 'sender', 'receiver'])
            ->where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)
                  ->orWhere('receiver_id', $userId);
            })
            ->orderBy('sent_at', 'asc')
            ->get();

        $grouped = [];

        foreach ($messages as $msg) {
            $otherUserId = ($msg->sender_id == $userId) ? $msg->receiver_id : $msg->sender_id;
            $adId = $msg->advertisements_id ?? 0;
            $threadId = "ad_{$adId}_user_{$otherUserId}";

            if (!isset($grouped[$threadId])) {
                $ad = $msg->advertisement;
                $otherUser = ($msg->sender_id == $userId) ? $msg->receiver : $msg->sender;

                $adImage = null;
                if ($ad && $ad->images && $ad->images->count() > 0) {
                    $imgUrl = $ad->images->first()->image_url;
                    if (!str_starts_with($imgUrl, 'http://') && !str_starts_with($imgUrl, 'https://')) {
                        $adImage = str_starts_with($imgUrl, '/') ? $imgUrl : (str_starts_with($imgUrl, 'storage/') ? '/' . $imgUrl : '/storage/' . $imgUrl);
                    } else {
                        $adImage = $imgUrl;
                    }
                }

                $sellerName = $otherUser ? $otherUser->username : 'Пользователь ТПУ';

                $grouped[$threadId] = [
                    'id'           => $threadId,
                    'listingId'    => $adId,
                    'listingTitle' => $ad ? $ad->title : 'Товар ТПУ Маркет',
                    'listingPrice' => $ad ? (float)$ad->price : 0,
                    'listingImage' => $adImage,
                    'sellerName'   => $sellerName,
                    'sellerAvatar' => mb_strtoupper(mb_substr($sellerName, 0, 1, 'UTF-8'), 'UTF-8'),
                    'otherUserId'  => $otherUserId,
                    'messages'     => [],
                    'updatedAt'    => $msg->sent_at ? strtotime($msg->sent_at) * 1000 : time() * 1000,
                    'unread'       => 0,
                ];
            }

            $isMe = ($msg->sender_id == $userId);
            $grouped[$threadId]['messages'][] = [
                'id'        => (string)$msg->message_id,
                'author'    => $isMe ? 'me' : 'seller',
                'text'      => $msg->message_text,
                'createdAt' => $msg->sent_at ? strtotime($msg->sent_at) * 1000 : time() * 1000,
            ];

            $msgTimestamp = $msg->sent_at ? strtotime($msg->sent_at) * 1000 : time() * 1000;
            if ($msgTimestamp > $grouped[$threadId]['updatedAt']) {
                $grouped[$threadId]['updatedAt'] = $msgTimestamp;
            }

            if (!$isMe && !$msg->is_read) {
                $grouped[$threadId]['unread']++;
            }
        }

        $threads = array_values($grouped);
        usort($threads, fn ($a, $b) => $b['updatedAt'] <=> $a['updatedAt']);

        $totalUnread = array_reduce($threads, fn ($carry, $t) => $carry + $t['unread'], 0);

        return response()->json([
            'success' => true,
            'threads' => $threads,
            'unread'  => $totalUnread,
        ]);
    }

    public function sendMessage(Request $request)
    {
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
                'message' => 'Необходима авторизация для отправки сообщений',
            ], 401);
        }

        $adId = (int)($request->input('advertisements_id') ?? $request->input('listingId') ?? 0);
        $receiverId = (int)($request->input('receiver_id') ?? $request->input('otherUserId') ?? 0);
        $text = trim((string)($request->input('message_text') ?? $request->input('text') ?? ''));

        if (empty($text)) {
            return response()->json([
                'success' => false,
                'message' => 'Текст сообщения не может быть пустым',
            ], 422);
        }

        if ($request->filled('threadId')) {
            if (preg_match('/ad_(\d+)_user_(\d+)/', (string)$request->input('threadId'), $m)) {
                if (!$adId) {
                    $adId = (int)$m[1];
                }
                if (!$receiverId) {
                    $receiverId = (int)$m[2];
                }
            }
        }

        if (!$receiverId && $adId) {
            $ad = advertisements_model::find($adId);
            if ($ad) {
                if ($ad->user_id == $userId) {
                    $lastMsg = Message::where('advertisements_id', $adId)
                        ->where(function ($q) use ($userId) {
                            $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
                        })
                        ->latest('message_id')
                        ->first();
                    if ($lastMsg) {
                        $receiverId = ($lastMsg->sender_id == $userId) ? $lastMsg->receiver_id : $lastMsg->sender_id;
                    }
                } else {
                    $receiverId = $ad->user_id;
                }
            }
        }

        if (!$receiverId) {
            $other = User::where('user_id', '!=', $userId)->first();
            $receiverId = $other ? $other->user_id : $userId;
        }

        $ad = $adId ? advertisements_model::find($adId) : null;
        $categoryId = $ad ? $ad->category_id : null;

        $msg = Message::create([
            'advertisements_id' => $adId ?: null,
            'category_id'       => $categoryId,
            'sender_id'         => $userId,
            'receiver_id'       => $receiverId,
            'message_text'      => $text,
            'is_read'           => false,
            'sent_at'           => now(),
        ]);

        $threadId = "ad_{$adId}_user_{$receiverId}";

        return response()->json([
            'success'  => true,
            'threadId' => $threadId,
            'message'  => [
                'id'        => (string)$msg->message_id,
                'author'    => 'me',
                'text'      => $msg->message_text,
                'createdAt' => strtotime($msg->sent_at) * 1000,
            ],
        ], 201);
    }

    public function markRead(Request $request, string $threadId)
    {
        $userId = Auth::id() ?? session('user_id');
        if (!$userId && $request->user()) {
            $userId = $request->user()->user_id;
        }
        if (!$userId && $request->filled('user_id')) {
            $userId = (int)$request->input('user_id');
        }

        if (!$userId) {
            return response()->json(['success' => false], 401);
        }

        if (preg_match('/ad_(\d+)_user_(\d+)/', $threadId, $m)) {
            $adId = (int)$m[1];
            $otherUserId = (int)$m[2];

            Message::where('advertisements_id', $adId)
                ->where('sender_id', $otherUserId)
                ->where('receiver_id', $userId)
                ->update(['is_read' => true]);
        }

        return response()->json(['success' => true]);
    }
}
