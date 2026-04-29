<?php

namespace App\Enums;

enum UpcomingExpensePaymentStatus: string
{
    case Paid = 'paid';
    case Unpaid = 'unpaid';
}
