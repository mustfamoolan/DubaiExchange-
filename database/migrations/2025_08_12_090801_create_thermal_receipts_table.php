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
        Schema::create('thermal_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique(); // رقم الفاتورة
            $table->string('transaction_type'); // نوع المعاملة (charge/payment)
            $table->string('service_type'); // نوع الخدمة (rafidain/rashid/zain_cash/super_key)
            $table->string('reference_number'); // رقم المرجع
            $table->decimal('amount', 15, 2); // المبلغ
            $table->decimal('commission', 15, 2); // العمولة
            $table->decimal('total_amount', 15, 2); // المبلغ الإجمالي
            $table->text('notes')->nullable(); // الملاحظات
            $table->string('customer_phone')->nullable(); // رقم هاتف العميل
            $table->string('employee_name'); // اسم الموظف
            $table->unsignedBigInteger('user_id'); // معرف المستخدم
            $table->json('receipt_settings')->nullable(); // إعدادات الفاتورة (للمستقبل)
            $table->boolean('is_printed')->default(false); // هل تم طباعتها
            $table->timestamp('printed_at')->nullable(); // وقت الطباعة
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['service_type', 'transaction_type']);
            $table->index(['created_at', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('thermal_receipts');
    }
};
