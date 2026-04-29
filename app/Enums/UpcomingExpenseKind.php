<?php

namespace App\Enums;

enum UpcomingExpenseKind: string
{
    case Fixed = 'fixed';
    case Variable = 'variable';
}
