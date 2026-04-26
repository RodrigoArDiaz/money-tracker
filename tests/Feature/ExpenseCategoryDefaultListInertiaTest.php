<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ExpenseCategoryDefaultListInertiaTest extends TestCase
{
    use LazilyRefreshDatabase;

    #[Test]
    public function index_includes_localized_default_category_names(): void
    {
        Artisan::call('default-expense-categories:sync');

        $userEs = User::factory()->create(['preferred_locale' => 'es']);
        $this->actingAs($userEs)
            ->get('/expense-categories')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('ExpenseCategories/Index')
                ->has('defaultExpenseCategories', 5)
                ->where('defaultExpenseCategories.4.name', 'Regalo')
                ->where('defaultExpenseCategories.4.icon', 'Gift'));

        $userEn = User::factory()->create(['preferred_locale' => 'en']);
        $this->actingAs($userEn)
            ->get('/expense-categories')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('defaultExpenseCategories.4.name', 'Gift'));
    }
}
