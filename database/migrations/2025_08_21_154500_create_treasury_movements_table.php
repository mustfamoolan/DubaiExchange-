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
        Schema::create('treasury_movements', function (Blueprint $table) {
            $table->id();

            // معلومات الحركة الأساسية
            $table->date('treasury_date')->comment('تاريخ الحركة');
            $table->enum('movement_type', ['distribution', 'return'])->comment('نوع الحركة: توزيع أو إرجاع');

            // ربط بالموظف
            $table->unsignedBigInteger('employee_id')->comment('معرف الموظف');
            $table->string('employee_name')->comment('اسم الموظف');
            $table->string('transaction_type')->nullable()->comment('نوع المعاملة');
            $table->string('reference_number')->unique()->comment('رقم المرجع');

            // المبالغ المحولة
            $table->decimal('amount_naqa', 15, 2)->default(0)->comment('مبلغ النقد');
            $table->decimal('amount_rafidain', 15, 2)->default(0)->comment('مبلغ الرافدين');
            $table->decimal('amount_rashid', 15, 2)->default(0)->comment('مبلغ الرشيد');
            $table->decimal('amount_zain_cash', 15, 2)->default(0)->comment('مبلغ زين كاش');
            $table->decimal('amount_super_key', 15, 2)->default(0)->comment('مبلغ سوبر كي');
            $table->decimal('amount_usd_cash', 15, 2)->default(0)->comment('مبلغ الدولار');

            // أرصدة الخزنة قبل الحركة
            $table->decimal('balance_before_naqa', 15, 2)->default(0)->comment('رصيد الخزنة قبل الحركة - نقد');
            $table->decimal('balance_before_rafidain', 15, 2)->default(0)->comment('رصيد الخزنة قبل الحركة - رافدين');
            $table->decimal('balance_before_rashid', 15, 2)->default(0)->comment('رصيد الخزنة قبل الحركة - رشيد');
            $table->decimal('balance_before_zain_cash', 15, 2)->default(0)->comment('رصيد الخزنة قبل الحركة - زين كاش');
            $table->decimal('balance_before_super_key', 15, 2)->default(0)->comment('رصيد الخزنة قبل الحركة - سوبر كي');
            $table->decimal('balance_before_usd_cash', 15, 2)->default(0)->comment('رصيد الخزنة قبل الحركة - دولار');

            // أرصدة الخزنة بعد الحركة
            $table->decimal('balance_after_naqa', 15, 2)->default(0)->comment('رصيد الخزنة بعد الحركة - نقد');
            $table->decimal('balance_after_rafidain', 15, 2)->default(0)->comment('رصيد الخزنة بعد الحركة - رافدين');
            $table->decimal('balance_after_rashid', 15, 2)->default(0)->comment('رصيد الخزنة بعد الحركة - رشيد');
            $table->decimal('balance_after_zain_cash', 15, 2)->default(0)->comment('رصيد الخزنة بعد الحركة - زين كاش');
            $table->decimal('balance_after_super_key', 15, 2)->default(0)->comment('رصيد الخزنة بعد الحركة - سوبر كي');
            $table->decimal('balance_after_usd_cash', 15, 2)->default(0)->comment('رصيد الخزنة بعد الحركة - دولار');

            // الربح والخسارة
            $table->decimal('profit_loss_amount', 15, 2)->default(0)->comment('مبلغ الربح أو الخسارة');
            $table->decimal('exchange_rate_used', 8, 2)->default(1400)->comment('سعر الصرف المستخدم');

            // معلومات إضافية
            $table->text('description')->nullable()->comment('وصف الحركة');
            $table->text('notes')->nullable()->comment('ملاحظات');
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('completed')->comment('حالة الحركة');
            $table->string('processed_by')->comment('تم المعالجة بواسطة');

            $table->timestamps();

            // فهارس
            $table->index('treasury_date');
            $table->index('movement_type');
            $table->index('employee_id');
            $table->index('status');
            $table->index(['treasury_date', 'movement_type']);
            $table->index(['employee_id', 'treasury_date']);

            // علاقات خارجية
            $table->foreign('employee_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treasury_movements');
    }
};
