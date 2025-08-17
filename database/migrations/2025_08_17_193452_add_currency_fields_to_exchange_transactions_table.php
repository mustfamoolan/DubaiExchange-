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
        Schema::table('exchange_transactions', function (Blueprint $table) {
            $table->string('currency')->default('دينار عراقي')->after('amount');
            $table->decimal('exchange_rate', 10, 2)->default(1)->after('currency');
            $table->decimal('original_amount', 15, 2)->nullable()->after('exchange_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exchange_transactions', function (Blueprint $table) {
            $table->dropColumn(['currency', 'exchange_rate', 'original_amount']);
        });
    }
};
