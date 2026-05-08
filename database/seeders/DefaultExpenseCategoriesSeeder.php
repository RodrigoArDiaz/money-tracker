<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class DefaultExpenseCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        Artisan::call('default-expense-categories:sync');
    }
}
