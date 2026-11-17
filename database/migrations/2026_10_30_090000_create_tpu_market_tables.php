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
        Schema::create('categories', function (Blueprint $table) {
            $table->id('category_id');
            $table->string('name', 100)->unique();
        });

        Schema::create('advertisements', function (Blueprint $table) {
            $table->id('advertisements_id');
            $table->foreignId('user_id')->constrained('users', 'user_id')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('categories', 'category_id');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->default(0.00);
            $table->string('status', 20)->default('active');
            $table->string('address', 255)->default('');
            $table->string('number', 30)->default('');
            $table->string('offer_type', 20)->default('sale');
            $table->string('condition', 20)->default('good');
            $table->timestamp('created_at')->useCurrent();

            $table->index('user_id');
            $table->index('status');
        });

        Schema::create('advertisements_images', function (Blueprint $table) {
            $table->id('image_id');
            $table->foreignId('advertisements_id')->constrained('advertisements', 'advertisements_id')->onDelete('cascade');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->text('image_url');
            $table->boolean('is_main')->default(false);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id('message_id');
            $table->foreignId('advertisements_id')->nullable()->constrained('advertisements', 'advertisements_id')->onDelete('set null');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->foreignId('sender_id')->constrained('users', 'user_id')->onDelete('cascade');
            $table->foreignId('receiver_id')->constrained('users', 'user_id')->onDelete('cascade');
            $table->text('message_text');
            $table->boolean('is_read')->default(false);
            $table->timestamp('sent_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('advertisements_images');
        Schema::dropIfExists('advertisements');
        Schema::dropIfExists('categories');
    }
};
