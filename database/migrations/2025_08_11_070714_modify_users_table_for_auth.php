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
        Schema::table('users', function (Blueprint $table) {
            // إضافة الحقول الجديدة
            $table->string('phone')->unique()->after('name'); // رقم الهاتف
            $table->enum('user_type', ['admin', 'employee'])->default('employee')->after('phone'); // نوع المستخدم
            $table->boolean('is_active')->default(true)->after('user_type'); // حالة المستخدم

            // جعل البريد الإلكتروني غير مطلوب
            $table->string('email')->nullable()->change();
            $table->dropUnique(['email']); // إزالة unique constraint من email
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // إزالة الحقول المضافة
            $table->dropColumn(['phone', 'user_type', 'is_active']);

            // إعادة البريد الإلكتروني كما كان
            $table->string('email')->nullable(false)->change();
            $table->unique('email');
        });
    }
};
