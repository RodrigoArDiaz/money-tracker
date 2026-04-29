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
        Schema::table('upcoming_expenses', function (Blueprint $table): void {
            $table->foreignId('expense_category_id')->nullable()->after('month')->constrained('expense_categories')->restrictOnDelete();
        });

        Schema::table('expenses', function (Blueprint $table): void {
            $table->foreignId('upcoming_expense_id')->nullable()->after('spent_on')->unique()->constrained('upcoming_expenses')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table): void {
            $table->dropForeign(['upcoming_expense_id']);
            $table->dropColumn('upcoming_expense_id');
        });

        Schema::table('upcoming_expenses', function (Blueprint $table): void {
            $table->dropForeign(['expense_category_id']);
            $table->dropColumn('expense_category_id');
        });
    }
};
