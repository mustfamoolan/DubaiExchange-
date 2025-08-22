<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('main_treasury', function (Blueprint $table) {
            $table->id();

            // الأرصدة الحالية للخزنة (نفس تقسيم opening_balances)
            $table->decimal('current_naqa', 15, 2)->default(0)->comment('النقد الحالي بالدينار العراقي');
            $table->decimal('current_rafidain', 15, 2)->default(0)->comment('رصيد مصرف الرافدين الحالي');
            $table->decimal('current_rashid', 15, 2)->default(0)->comment('رصيد مصرف الرشيد الحالي');
            $table->decimal('current_zain_cash', 15, 2)->default(0)->comment('رصيد زين كاش الحالي');
            $table->decimal('current_super_key', 15, 2)->default(0)->comment('رصيد سوبر كي الحالي');
            $table->decimal('current_usd_cash', 15, 2)->default(0)->comment('الدولار النقدي الحالي');

            // سعر الصرف الحالي
            $table->decimal('current_exchange_rate', 8, 2)->default(1400)->comment('سعر الصرف الحالي');

            // الإجماليات المحسوبة
            $table->decimal('total_iqd', 15, 2)->default(0)->comment('إجمالي الدينار العراقي');
            $table->decimal('total_usd_in_iqd', 15, 2)->default(0)->comment('إجمالي الدولار محولاً للدينار');
            $table->decimal('grand_total', 15, 2)->default(0)->comment('الإجمالي العام بالدينار');

            // تواريخ مهمة
            $table->date('treasury_date')->comment('تاريخ الخزنة');
            $table->timestamp('last_updated')->useCurrent()->comment('آخر تحديث');

            // حالة الخزنة
            $table->enum('status', ['active', 'closed', 'maintenance'])->default('active')->comment('حالة الخزنة');

            // معلومات الإنشاء والتحديث
            $table->string('created_by')->nullable()->comment('أنشئ بواسطة');
            $table->string('updated_by')->nullable()->comment('حُدث بواسطة');
            $table->text('notes')->nullable()->comment('ملاحظات');

            $table->timestamps();

            // فهارس
            $table->index('treasury_date');
            $table->index('status');
            $table->index(['status', 'treasury_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('main_treasury');
    }
};
