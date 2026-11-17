<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'user_id';

    protected $fillable = [
        'username',
        'email',
        'password_hash',
        'phone',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function getAuthPasswordName()
    {
        return 'password_hash';
    }

    // Accessor and Mutator for 'name' to keep compatibility with standard Laravel Auth
    public function getNameAttribute()
    {
        return $this->attributes['username'] ?? null;
    }

    public function setNameAttribute($value)
    {
        $this->attributes['username'] = $value;
    }

    // Связь с объявлениями (один пользователь имеет много объявлений)
    public function advertisements()
    {
        return $this->hasMany(advertisements_model::class, 'user_id', 'user_id');
    }
}
