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
            $table->string('currency_type', 3)->default('iqd')->after('amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exchange_transactions', function (Blueprint $table) {
            $table->dropColumn('currency_type');
        });
    }
};
