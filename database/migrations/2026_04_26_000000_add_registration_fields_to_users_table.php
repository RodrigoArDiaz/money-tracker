<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('google_id')->nullable()->unique();
        });

        if (Schema::hasColumn('users', 'name')) {
            foreach (DB::table('users')->cursor() as $row) {
                DB::table('users')->where('id', $row->id)->update([
                    'first_name' => $row->name,
                    'last_name' => '',
                ]);
            }

            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable(false)->change();
            $table->string('last_name')->default('')->nullable(false)->change();
            $table->string('password')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable();
        });

        foreach (DB::table('users')->cursor() as $row) {
            $full = trim(($row->first_name ?? '').' '.($row->last_name ?? ''));
            DB::table('users')->where('id', $row->id)->update([
                'name' => $full !== '' ? $full : ($row->email ?? 'User'),
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'google_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable(false)->change();
        });

        foreach (DB::table('users')->whereNull('password')->cursor() as $row) {
            DB::table('users')->where('id', $row->id)->update([
                'password' => Hash::make(Str::password()),
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable(false)->change();
        });
    }
};
