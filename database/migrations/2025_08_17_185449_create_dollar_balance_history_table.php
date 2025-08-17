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
        Schema::create('dollar_balance_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->enum('transaction_type', ['buy', 'sell', 'receive', 'exchange']);
            $table->decimal('amount', 15, 2);
            $table->decimal('previous_balance', 15, 2);
            $table->decimal('new_balance', 15, 2);
            $table->string('transaction_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dollar_balance_history');
    }
};
