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
        Schema::create('customer_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_code')->unique(); // رقم المعاملة
            $table->foreignId('customer_id')->constrained()->onDelete('cascade'); // العميل
            $table->foreignId('user_id')->constrained()->onDelete('restrict'); // الموظف
            $table->enum('transaction_type', ['received', 'delivered']); // نوع المعاملة: مستلم أو مسلم
            $table->enum('currency_type', ['iqd', 'usd']); // نوع العملة
            $table->decimal('amount', 15, 2); // المبلغ
            $table->decimal('exchange_rate', 10, 4)->nullable(); // سعر الصرف إذا كان التحويل بين العملات
            $table->text('description')->nullable(); // وصف المعاملة
            $table->text('notes')->nullable(); // ملاحظات
            $table->timestamp('transaction_date'); // تاريخ المعاملة
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_transactions');
    }
};
