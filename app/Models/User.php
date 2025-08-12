<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'phone',
        'email',
        'password',
        'user_type',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * التحقق من أن المستخدم أدمن
     */
    public function isAdmin(): bool
    {
        return $this->user_type === 'admin';
    }

    /**
     * التحقق من أن المستخدم موظف
     */
    public function isEmployee(): bool
    {
        return $this->user_type === 'employee';
    }

    /**
     * التحقق من أن المستخدم نشط
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * العلاقة مع الأرصدة الافتتاحية
     */
    public function openingBalances()
    {
        return $this->hasMany(OpeningBalance::class);
    }
}
