<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $table = 'categories';
    protected $primaryKey = 'category_id';
    public $timestamps = false;

    protected $fillable = ['category_id', 'name'];

    public function advertisements()
    {
        return $this->hasMany(advertisements_model::class, 'category_id', 'category_id');
    }
}
