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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('customer_code')->unique(); // رمز العميل الأوتوماتيكي
            $table->string('name'); // اسم العميل
            $table->string('phone')->unique(); // رقم الهاتف
            $table->decimal('iqd_opening_balance', 15, 2)->default(0); // الرصيد الافتتاحي دينار
            $table->decimal('usd_opening_balance', 15, 2)->default(0); // الرصيد الافتتاحي دولار
            $table->decimal('current_iqd_balance', 15, 2)->default(0); // الرصيد الحالي دينار
            $table->decimal('current_usd_balance', 15, 2)->default(0); // الرصيد الحالي دولار
            $table->boolean('is_active')->default(true); // حالة العميل
            $table->text('notes')->nullable(); // ملاحظات
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
