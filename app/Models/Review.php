<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $table = 'reviews';
    protected $primaryKey = 'review_id';
    public $timestamps = false;

    protected $fillable = [
        'advertisements_id',
        'seller_id',
        'author_id',
        'stars',
        'text',
        'created_at',
    ];

    protected $casts = [
        'stars'      => 'integer',
        'created_at' => 'datetime',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id', 'user_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id', 'user_id');
    }

    public function advertisement()
    {
        return $this->belongsTo(advertisements_model::class, 'advertisements_id', 'advertisements_id');
    }

    public function toFrontendArray(): array
    {
        $authorName = $this->author ? $this->author->username : 'Студент ТПУ';
        $timeAgoStr = 'недавно';
        if ($this->created_at) {
            $diffDays = (int) $this->created_at->diffInDays(now());
            if ($diffDays === 0) {
                $diffHours = (int) $this->created_at->diffInHours(now());
                $timeAgoStr = $diffHours > 0 ? "{$diffHours} ч назад" : "только что";
            } else {
                $timeAgoStr = "{$diffDays} дн назад";
            }
        }

        return [
            'id'      => $this->review_id,
            'author'  => $authorName,
            'unit'    => 'Кампус ТПУ',
            'stars'   => (int) $this->stars,
            'text'    => $this->text,
            'when'    => $timeAgoStr,
            'subject' => $this->advertisement ? $this->advertisement->title : 'Товар ТПУ Маркет',
        ];
    }
}
