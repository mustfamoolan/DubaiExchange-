<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';

use App\Models\User;

// تحديث user_type للمستخدم رقم 2
$user = User::find(2);
if ($user) {
    $user->user_type = 'employee';
    $user->save();
    echo "تم تحديث user_type للمستخدم رقم {$user->id} إلى employee" . PHP_EOL;
    echo "الاسم: {$user->name}" . PHP_EOL;
    echo "النوع: {$user->user_type}" . PHP_EOL;
} else {
    echo "المستخدم غير موجود" . PHP_EOL;
}
