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
        Schema::create('financing_plans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('expense_category_id')->constrained('expense_categories')->restrictOnDelete();
            $table->string('description');
            $table->text('note')->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });

        Schema::table('upcoming_expenses', function (Blueprint $table): void {
            $table->foreignId('financing_plan_id')
                ->nullable()
                ->after('recurring_template_id')
                ->constrained('financing_plans')
                ->cascadeOnDelete();
            $table->unsignedSmallInteger('plan_installment_number')
                ->nullable()
                ->after('financing_plan_id');
        });

        Schema::table('upcoming_expenses', function (Blueprint $table): void {
            $table->unique(['financing_plan_id', 'plan_installment_number'], 'upcoming_expenses_plan_installment_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('upcoming_expenses', function (Blueprint $table): void {
            $table->dropUnique('upcoming_expenses_plan_installment_unique');
            $table->dropForeign(['financing_plan_id']);
            $table->dropColumn(['financing_plan_id', 'plan_installment_number']);
        });

        Schema::dropIfExists('financing_plans');
    }
};
