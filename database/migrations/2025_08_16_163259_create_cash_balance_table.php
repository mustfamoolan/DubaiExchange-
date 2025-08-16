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
        Schema::create('cash_balance', function (Blueprint $table) {
            $table->id();
            $table->decimal('current_cash_balance', 15, 2)->default(0); // الرصيد النقدي الحالي
            $table->decimal('opening_cash_balance', 15, 2)->default(0); // الرصيد النقدي الافتتاحي
            $table->timestamp('last_updated_at')->nullable(); // آخر تحديث
            $table->unsignedBigInteger('last_updated_by')->nullable(); // آخر من قام بالتحديث
            $table->string('last_transaction_type', 50)->nullable(); // نوع آخر معاملة
            $table->string('last_transaction_source', 50)->nullable(); // مصدر آخر معاملة (zain_cash, rafidain, etc.)
            $table->unsignedBigInteger('last_transaction_id')->nullable(); // معرف آخر معاملة
            $table->decimal('last_transaction_amount', 15, 2)->nullable(); // مبلغ آخر معاملة
            $table->text('notes')->nullable(); // ملاحظات
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('last_updated_by')->references('id')->on('users')->onDelete('set null');

            // Indexes for better performance
            $table->index(['last_updated_at']);
            $table->index(['last_transaction_source', 'last_transaction_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_balance');
    }
};
