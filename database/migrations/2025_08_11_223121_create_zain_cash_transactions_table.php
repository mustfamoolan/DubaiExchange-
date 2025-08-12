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
        Schema::create('zain_cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('reference_number')->unique(); // رقم المرجع
            $table->enum('transaction_type', ['charge', 'payment']); // نوع العملية: شحن أو دفع
            $table->decimal('amount', 15, 2); // المبلغ
            $table->decimal('commission', 15, 2)->default(0); // العمولة
            $table->decimal('total_with_commission', 15, 2); // الإجمالي مع العمولة
            $table->decimal('balance_change', 15, 2); // كم زاد أو نقص من الرصيد
            $table->decimal('previous_balance', 15, 2); // الرصيد السابق
            $table->decimal('new_balance', 15, 2); // الرصيد الجديد
            $table->text('notes')->nullable(); // الملاحظات
            $table->string('entered_by'); // اسم المدخل (الموظف)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zain_cash_transactions');
    }
};
