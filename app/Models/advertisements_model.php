<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class advertisements_model extends Model
{
    protected $table = 'advertisements';
    protected $primaryKey = 'advertisements_id';

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'description',
        'price',
        'status',
        'address',
        'number',
        'offer_type',
        'condition',
        'created_at',
    ];

    public $timestamps = false;

    public const CATEGORIES = [
        1  => 'Посуда',
        2  => 'Канцелярия',
        3  => 'Текстиль',
        4  => 'Периферия',
        5  => 'Гаджеты',
        6  => 'Мерч',
        7  => 'Спорт',
        8  => 'Настолки',
        9  => 'Гейминг',
        10 => 'Творчество',
        11 => 'Верхняя одежда',
        12 => 'Учебники и пособия',
        13 => 'Комплектующие',
        14 => 'Курсовые и конспекты',
        15 => 'Бытовая техника',
    ];

    protected $with = ['user', 'images', 'category'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'category_id');
    }

    public function images()
    {
        return $this->hasMany(advertisements_images_model::class, 'advertisements_id', 'advertisements_id');
    }

    public function toFrontendArray(): array
    {
        $allImages = $this->images
            ->sortByDesc('is_main')
            ->map(function ($img) {
                $url = $img->image_url;
                if (!str_starts_with($url, 'http://') && !str_starts_with($url, 'https://')) {
                    if (str_starts_with($url, '/')) {
                        return $url;
                    }
                    if (str_starts_with($url, 'storage/') || str_starts_with($url, 'ads/')) {
                        return '/' . $url;
                    }
                    return '/storage/' . $url;
                }
                return $url;
            })
            ->values()
            ->all();

        $mainImage = count($allImages) > 0 ? $allImages[0] : null;

        $createdTimestamp = $this->created_at ? strtotime($this->created_at) * 1000 : time() * 1000;

        $rawStatus = $this->status ?: 'available';
        $status = ($rawStatus === 'active') ? 'available' : $rawStatus;

        return [
            'id'          => $this->advertisements_id,
            'title'       => $this->title,
            'description' => $this->description ?? '',
            'price'       => (float) $this->price,
            'offerType'   => $this->offer_type ?: ($this->price == 0 ? 'free' : 'sale'),
            'condition'   => $this->condition ?: 'good',
            'category'    => self::CATEGORIES[$this->category_id] ?? ($this->category ? $this->category->name : 'Прочее'),
            'category_id' => $this->category_id,
            'dorm'        => $this->address ?: 'Кампус ТПУ',
            'number'      => $this->number ?: '',
            'status'      => $status,
            'createdAt'   => $createdTimestamp,
            'image'       => $mainImage,
            'images'      => $allImages,
            'seller'      => [
                'id'        => $this->user_id,
                'name'      => $this->user ? $this->user->username : 'Пользователь ТПУ',
                'email'     => $this->user ? $this->user->email : '',
                'phone'     => $this->user ? $this->user->phone : $this->number,
                'rating'    => 4.9,
                'reviews'   => 15,
                'institute' => 'ТПУ',
            ],
        ];
    }

    public function modalJson(): string
    {
        $images = $this->images
            ->sortByDesc('is_main')
            ->map(fn ($img) => asset($img->image_url))
            ->values()
            ->all();

        $date = null;
        if (!empty($this->created_at)) {
            try {
                $date = \Illuminate\Support\Carbon::parse($this->created_at)->format('d.m.Y H:i');
            } catch (\Throwable $e) {
                $date = null;
            }
        }

        $statusLabels = ['active' => 'Активно', 'inactive' => 'Снято с публикации', 'sold' => 'Продано'];

        return json_encode([
            'id'           => $this->advertisements_id,
            'title'        => $this->title,
            'description'  => $this->description,
            'price'        => number_format((float) $this->price, 0, '.', ' ') . ' ₽',
            'category'     => self::CATEGORIES[$this->category_id] ?? null,
            'number'       => $this->number,
            'address'      => $this->address,
            'status'       => $this->status,
            'status_label' => $statusLabels[$this->status] ?? $this->status,
            'date'         => $date,
            'seller'       => $this->user->username ?? null,
            'images'       => $images,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
