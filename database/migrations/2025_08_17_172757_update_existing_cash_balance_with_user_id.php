<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\CashBalance;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // تحديث السجلات الموجودة التي لا تحتوي على user_id
        // سنقوم بربط الرصيد بأول مستخدم موظف في النظام
        $firstEmployee = User::where('user_type', 'employee')->first();

        if ($firstEmployee) {
            // تحديث جميع السجلات التي لا تحتوي على user_id
            CashBalance::whereNull('user_id')->update([
                'user_id' => $firstEmployee->id
            ]);

            echo "Updated cash balance records for user: " . $firstEmployee->name . "\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // إرجاع user_id إلى null للسجلات المحدثة
        CashBalance::whereNotNull('user_id')->update([
            'user_id' => null
        ]);
    }
};
