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
        Schema::table('financing_plans', function (Blueprint $table): void {
            // Sin ->after(): SQLite no admite posición de columna en ALTER y evita fallos raros.
            $table->timestamp('archived_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financing_plans', function (Blueprint $table): void {
            $table->dropColumn('archived_at');
        });
    }
};
