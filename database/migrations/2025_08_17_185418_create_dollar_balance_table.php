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
        Schema::create('dollar_balance', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dollar_balance');
    }
};
