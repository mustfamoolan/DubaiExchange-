<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // إنشاء حساب الأدمن
        User::updateOrCreate(
            ['phone' => '01234567890'], // البحث عن رقم الهاتف
            [
                'name' => 'أدمن النظام',
                'phone' => '01234567890',
                'password' => Hash::make('12345678'),
                'user_type' => 'admin',
                'is_active' => true,
                'email' => null, // لا نحتاج بريد إلكتروني
            ]
        );

        echo "تم إنشاء حساب الأدمن بنجاح!\n";
        echo "رقم الهاتف: 01234567890\n";
        echo "كلمة المرور: 12345678\n";
    }
}
