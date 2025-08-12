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
        Schema::table('receive_transactions', function (Blueprint $table) {
            $table->decimal('exchange_rate', 12, 4)->nullable()->after('currency');
            $table->decimal('amount_in_iqd', 15, 2)->nullable()->after('exchange_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receive_transactions', function (Blueprint $table) {
            $table->dropColumn(['exchange_rate', 'amount_in_iqd']);
        });
    }
};
