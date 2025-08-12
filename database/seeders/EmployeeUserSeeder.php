<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class EmployeeUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['phone' => '07700000001'], // البحث بالهاتف
            [
                'name' => 'محمد أحمد',
                'phone' => '07700000001',
                'password' => Hash::make('password'),
                'user_type' => 'employee',
                'is_active' => true,
            ]
        );
    }
}
