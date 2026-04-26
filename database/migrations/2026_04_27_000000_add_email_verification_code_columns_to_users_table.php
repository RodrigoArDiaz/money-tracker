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
        Schema::table('users', function (Blueprint $table) {
            $table->string('email_verification_code_hash')->nullable();
            $table->timestamp('email_verification_code_expires_at')->nullable();
            $table->timestamp('email_verification_sent_at')->nullable();
            $table->unsignedTinyInteger('email_verification_failed_attempts')->default(0);
            $table->timestamp('email_verification_locked_until')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'email_verification_code_hash',
                'email_verification_code_expires_at',
                'email_verification_sent_at',
                'email_verification_failed_attempts',
                'email_verification_locked_until',
            ]);
        });
    }
};
