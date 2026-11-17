<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Exception;

class proverka_registr extends Controller
{
    public function store(Request $request)
    {
        try {
            $login = trim($request->input('username') ?? $request->input('login') ?? $request->input('email'));
            $password = trim($request->input('password') ?? '');

            if (empty($login) || empty($password)) {
                if ($request->wantsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Заполните логин и пароль',
                    ], 422);
                }
                return redirect()->back()->withErrors(['message' => 'Заполните логин и пароль']);
            }

            $user = User::where('username', $login)
                ->orWhere('email', $login)
                ->first();

            if ($user && Hash::check($password, $user->password_hash)) {
                Auth::login($user);
                if ($request->hasSession()) {
                    $request->session()->regenerate();
                }

                $token = $user->createToken('auth-token')->plainTextToken;

                if ($request->wantsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Авторизация успешна',
                        'token'   => $token,
                        'user'    => [
                            'user_id'  => $user->user_id,
                            'username' => $user->username,
                            'email'    => $user->email,
                            'phone'    => $user->phone,
                        ],
                    ]);
                }

                return redirect('/glavnaya');
            }

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Неверный логин или пароль',
                ], 401);
            }

            return redirect()->back()->withErrors(['message' => 'Неверный логин или пароль']);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации данных',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка при обработке запроса: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function me(Request $request)
    {
        $user = $request->user() ?? Auth::user();

        if (!$user && $request->filled('user_id')) {
            $user = User::find($request->input('user_id'));
        }

        if ($user) {
            return response()->json([
                'success' => true,
                'user'    => [
                    'user_id'  => $user->user_id,
                    'username' => $user->username,
                    'email'    => $user->email,
                    'phone'    => $user->phone,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Пользователь не авторизован',
        ], 401);
    }

    public function logoutWeb(Request $request)
    {
        Auth::logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
        return redirect()->route('registr');
    }

    public function logout(Request $request)
    {
        $user = $request->user() ?? Auth::user();

        if ($user && method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        Auth::logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'Вы успешно вышли из системы',
        ]);
    }
}
