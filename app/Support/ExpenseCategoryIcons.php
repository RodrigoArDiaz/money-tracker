<?php

namespace App\Support;

final class ExpenseCategoryIcons
{
    /**
     * @return list<string>
     */
    public static function names(): array
    {
        /** @var list<string> $names */
        $names = config('expense_category_icons.names', []);

        return array_values(array_unique($names));
    }
}
