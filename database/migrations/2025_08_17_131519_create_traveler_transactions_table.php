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
        Schema::create('traveler_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('receipt_number')->unique();
            $table->string('trip_number');
            $table->string('full_name');
            $table->decimal('usd_amount', 10, 2);
            $table->decimal('exchange_rate', 8, 2);
            $table->decimal('iqd_amount', 15, 2);
            $table->decimal('total_iqd', 15, 2);
            $table->decimal('previous_balance', 15, 2);
            $table->decimal('new_balance', 15, 2);
            $table->string('entered_by');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users');
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('traveler_transactions');
    }
};
