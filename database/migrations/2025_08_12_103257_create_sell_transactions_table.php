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
        Schema::create('sell_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('reference_number')->unique(); // رقم المرجع (documentNumber)
            $table->decimal('dollar_amount', 15, 2); // المبلغ بالدولار
            $table->decimal('exchange_rate', 10, 4); // سعر الصرف
            $table->decimal('iqd_amount', 15, 2); // المبلغ بالدينار العراقي (دولار * سعر الصرف)
            $table->decimal('commission', 15, 2)->default(0); // العمولة بالدينار العراقي
            $table->decimal('total_amount', 15, 2); // المبلغ الكلي (دينار عراقي + عمولة)
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
        Schema::dropIfExists('sell_transactions');
    }
};
