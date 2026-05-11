/** Navbar title for the dashboard shell from the current path (bilingual via `t`). */
export function dashboardHeaderTitleFromPath(pathOnly: string, t: (key: string) => string): string {
    if (pathOnly === '/upcoming-expenses/recurring') {
        return t('upcoming_expenses.recurring.layout_title');
    }
    if (pathOnly === '/financing-plans') {
        return t('financing_plans.layout_title');
    }
    if (pathOnly === '/upcoming-expenses') {
        return t('upcoming_expenses.nav_label');
    }
    if (pathOnly.startsWith('/expense-categories')) {
        return t('expense_categories.nav_label');
    }
    if (pathOnly.startsWith('/charts')) {
        return t('charts.title');
    }
    if (pathOnly === '/' || pathOnly === '') {
        return t('dashboard.header_default');
    }

    return t('dashboard.header_default');
}
