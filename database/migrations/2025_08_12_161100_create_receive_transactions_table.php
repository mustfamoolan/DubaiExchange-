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
        Schema::create('receive_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // معرف المستخدم
            $table->string('document_number'); // رقم المستند
            $table->string('received_from'); // استلمت من السيد
            $table->decimal('amount', 15, 2); // المبلغ
            $table->string('currency', 100); // العملة
            $table->text('description')->nullable(); // وذلك عن (الوصف)
            $table->string('beneficiary'); // الجهة المستفيدة
            $table->string('receiver_name'); // اسم المستلم
            $table->decimal('previous_balance', 15, 2)->default(0); // الرصيد السابق
            $table->decimal('new_balance', 15, 2)->default(0); // الرصيد الجديد
            $table->text('notes')->nullable(); // ملاحظات
            $table->string('entered_by'); // مدخل البيانات
            $table->timestamps();

            // الفهارس
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'created_at']);
            $table->index(['currency']);
            $table->index(['beneficiary']);
            $table->index(['document_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receive_transactions');
    }
};
