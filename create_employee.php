<?php

use App\Models\User;

// إنشاء موظف تجريبي
$user = new User();
$user->name = 'موظف تجريبي';
$user->phone = '07901234567';
$user->role = 'employee';
$user->is_active = true;
$user->save();

echo "تم إنشاء موظف برقم: " . $user->id . PHP_EOL;
echo "الاسم: " . $user->name . PHP_EOL;
echo "الهاتف: " . $user->phone . PHP_EOL;
echo "النوع: " . $user->role . PHP_EOL;
