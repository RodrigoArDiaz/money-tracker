<?php

namespace App\Console\Commands;

use App\Models\ExpenseCategory;
use App\Support\ExpenseCategoryIcons;
use Illuminate\Console\Command;

class InsertDefaultExpenseCategoriesCommand extends Command
{
    protected $signature = 'default-expense-categories:sync';

    protected $description = 'Inserta o actualiza las categorías de gasto predeterminadas del sistema (misma tabla expense_categories, user_id null, names JSON).';

    public function handle(): int
    {
        $allowedIcons = array_flip(ExpenseCategoryIcons::names());

        foreach ($this->definitions() as $row) {
            if (! isset($allowedIcons[$row['icon']])) {
                $this->error("Icono no permitido: {$row['icon']} (slug {$row['slug']})");

                return self::FAILURE;
            }
        }

        foreach ($this->definitions() as $row) {
            ExpenseCategory::query()->updateOrCreate(
                ['slug' => $row['slug']],
                [
                    'user_id' => null,
                    'name' => null,
                    'names' => $row['names'],
                    'icon' => $row['icon'],
                    'sort_order' => $row['sort_order'],
                ],
            );
        }

        $count = ExpenseCategory::query()->system()->count();
        $this->info("Categorías predeterminadas sincronizadas: {$count} filas (user_id null).");

        return self::SUCCESS;
    }

    /**
     * @return list<array{slug: string, icon: string, sort_order: int, names: array<string, string>}>
     */
    private function definitions(): array
    {
        return [
            [
                'slug' => 'health',
                'icon' => 'Hospital',
                'sort_order' => 1,
                'names' => ['es' => 'Salud', 'en' => 'Health'],
            ],
            [
                'slug' => 'transport',
                'icon' => 'Bus',
                'sort_order' => 2,
                'names' => ['es' => 'Transporte', 'en' => 'Transport'],
            ],
            [
                'slug' => 'clothing',
                'icon' => 'Shirt',
                'sort_order' => 3,
                'names' => ['es' => 'Ropa', 'en' => 'Clothing'],
            ],
            [
                'slug' => 'food',
                'icon' => 'Pizza',
                'sort_order' => 4,
                'names' => ['es' => 'Comida', 'en' => 'Food'],
            ],
            [
                'slug' => 'gift',
                'icon' => 'Gift',
                'sort_order' => 5,
                'names' => ['es' => 'Regalo', 'en' => 'Gift'],
            ],
            [
                'slug' => 'entertainment',
                'icon' => 'Film',
                'sort_order' => 6,
                'names' => ['es' => 'Entretenimiento', 'en' => 'Entertainment'],
            ],
            [
                'slug' => 'education',
                'icon' => 'GraduationCap',
                'sort_order' => 7,
                'names' => ['es' => 'Educación', 'en' => 'Education'],
            ],
            [
                'slug' => 'repairs',
                'icon' => 'Wrench',
                'sort_order' => 8,
                'names' => ['es' => 'Reparaciones', 'en' => 'Repairs'],
            ],
            [
                'slug' => 'pets',
                'icon' => 'PawPrint',
                'sort_order' => 9,
                'names' => ['es' => 'Mascotas', 'en' => 'Pets'],
            ],
            [
                'slug' => 'donations',
                'icon' => 'Heart',
                'sort_order' => 10,
                'names' => ['es' => 'Donaciones', 'en' => 'Donations'],
            ],
            [
                'slug' => 'snacks',
                'icon' => 'Cookie',
                'sort_order' => 11,
                'names' => ['es' => 'Snacks', 'en' => 'Snacks'],
            ],
        ];
    }
}
