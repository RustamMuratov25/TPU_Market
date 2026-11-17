<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id('review_id');
            $table->foreignId('advertisements_id')->nullable()->constrained('advertisements', 'advertisements_id')->onDelete('set null');
            $table->foreignId('seller_id')->constrained('users', 'user_id')->onDelete('cascade');
            $table->foreignId('author_id')->constrained('users', 'user_id')->onDelete('cascade');
            $table->unsignedTinyInteger('stars')->default(5);
            $table->text('text');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
