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
        Schema::create('opening_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // المستخدم/الموظف
            $table->date('opening_date'); // تاريخ فتح الرصيد
            $table->enum('status', ['pending', 'active', 'closed', 'retrieved', 'cancelled'])->default('pending');
            // معلق، مفتوح، مغلق، مسترجع، ملغي

            // الحقول المالية
            $table->decimal('naqa', 15, 2)->default(0); // نقداً
            $table->decimal('rafidain', 15, 2)->default(0); // مصرف الرافدين
            $table->decimal('rashid', 15, 2)->default(0); // مصرف الرشيد
            $table->decimal('zain_cash', 15, 2)->default(0); // زين كاش
            $table->decimal('super_key', 15, 2)->default(0); // سوبر كي
            $table->decimal('usd_cash', 15, 2)->default(0); // الدولار الأمريكي
            $table->decimal('exchange_rate', 8, 2)->default(1400); // سعر الصرف

            // المجاميع المحسوبة
            $table->decimal('total_iqd', 15, 2)->default(0); // إجمالي الدينار العراقي
            $table->decimal('total_usd_in_iqd', 15, 2)->default(0); // إجمالي الدولار بالدينار
            $table->decimal('grand_total', 15, 2)->default(0); // الإجمالي الكلي

            // بيانات الإغلاق
            $table->date('closing_date')->nullable(); // تاريخ الإغلاق
            $table->decimal('closing_naqa', 15, 2)->nullable(); // نقداً عند الإغلاق
            $table->decimal('closing_rafidain', 15, 2)->nullable(); // الرافدين عند الإغلاق
            $table->decimal('closing_rashid', 15, 2)->nullable(); // الرشيد عند الإغلاق
            $table->decimal('closing_zain_cash', 15, 2)->nullable(); // زين كاش عند الإغلاق
            $table->decimal('closing_super_key', 15, 2)->nullable(); // سوبر كي عند الإغلاق
            $table->decimal('closing_usd_cash', 15, 2)->nullable(); // الدولار عند الإغلاق
            $table->decimal('closing_exchange_rate', 8, 2)->nullable(); // سعر الصرف عند الإغلاق
            $table->decimal('closing_total', 15, 2)->nullable(); // الإجمالي عند الإغلاق

            // ملاحظات ومراجعة
            $table->text('notes')->nullable(); // ملاحظات
            $table->string('created_by')->nullable(); // من أنشأ الرصيد
            $table->string('updated_by')->nullable(); // من حدث الرصيد
            $table->string('closed_by')->nullable(); // من أغلق الرصيد

            $table->timestamps();

            // فهارس
            $table->index(['user_id', 'opening_date']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opening_balances');
    }
};
