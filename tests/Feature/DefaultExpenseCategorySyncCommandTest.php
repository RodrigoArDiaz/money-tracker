<?php

namespace Tests\Feature;

use App\Models\ExpenseCategory;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DefaultExpenseCategorySyncCommandTest extends TestCase
{
    use LazilyRefreshDatabase;

    #[Test]
    public function sync_command_inserts_system_categories_with_json_names(): void
    {
        $exit = Artisan::call('default-expense-categories:sync');

        $this->assertSame(0, $exit);
        $this->assertSame(11, ExpenseCategory::query()->system()->count());

        $food = ExpenseCategory::query()->system()->where('slug', 'food')->firstOrFail();
        $this->assertSame('Pizza', $food->icon);
        $this->assertSame(['es' => 'Comida', 'en' => 'Food'], $food->names);

        $education = ExpenseCategory::query()->system()->where('slug', 'education')->firstOrFail();
        $this->assertSame('GraduationCap', $education->icon);
        $this->assertSame(['es' => 'Educación', 'en' => 'Education'], $education->names);
    }

    #[Test]
    public function sync_command_is_idempotent(): void
    {
        Artisan::call('default-expense-categories:sync');
        Artisan::call('default-expense-categories:sync');

        $this->assertSame(11, ExpenseCategory::query()->system()->count());
    }
}
