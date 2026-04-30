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
        Schema::create('upcoming_expense_recurring_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('expense_category_id')->constrained('expense_categories')->restrictOnDelete();
            $table->string('description');
            $table->text('note')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('kind', 16);
            $table->string('cadence', 16);
            $table->unsignedSmallInteger('start_year');
            $table->unsignedTinyInteger('start_month');
            $table->unsignedSmallInteger('end_year')->nullable();
            $table->unsignedTinyInteger('end_month')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
        });

        Schema::table('upcoming_expenses', function (Blueprint $table): void {
            $table->foreignId('recurring_template_id')
                ->nullable()
                ->after('user_id')
                ->constrained('upcoming_expense_recurring_templates')
                ->nullOnDelete();
        });

        Schema::table('upcoming_expenses', function (Blueprint $table): void {
            $table->unique(['recurring_template_id', 'year', 'month'], 'upcoming_expenses_recurring_month_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('upcoming_expenses', function (Blueprint $table): void {
            $table->dropUnique('upcoming_expenses_recurring_month_unique');
            $table->dropForeign(['recurring_template_id']);
            $table->dropColumn('recurring_template_id');
        });

        Schema::dropIfExists('upcoming_expense_recurring_templates');
    }
};
