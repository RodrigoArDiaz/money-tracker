# Controller–Service–Repository

Layered pattern: **Controller → Service → Repository → Model / persistence**. In this project, a **Repository is mandatory**: **Services** must not perform domain persistence or domain queries by calling **Eloquent / `Model::` / `DB::`** directly; that access belongs in a **Repository** (concrete class, or interface + binding in the container).

## Consistency with existing code

If you find legacy controllers or services without a repository, **do not mix** styles in the same use case—when you touch a flow, introduce or align the repository. For **new** code, always use all three layers. The skill-level *Consistency First* rule does **not** exempt you from adding a repository when you extend or refactor a resource.

## Responsibilities

| Layer | Owns | Avoids |
|-------|------|--------|
| **Controller** | HTTP: route params, `FormRequest`, `authorize`, response (redirect, JSON, `Inertia::render`) | Business rules, queries, transactions that span multiple use cases |
| **Service** | One application use case (or a cohesive subset), orchestration, **`DB::transaction()`** when multiple write steps must commit together | Direct `Model::`, `DB::`, or query builder calls for domain that already has a repository; duplicating the same query across services without going through the repository |
| **Repository** | Reads and writes for the aggregate or module (find, create, update, delete, listings, reusable query shapes) | HTTP, session, `Request`, authorization (that stays in controller / Form Request / policy) |

## Repository always

- **Every domain resource** with persistence (e.g. `Expense`, `ExpenseCategory`) must have a **dedicated repository** (`ExpenseRepository`, …) or share one that matches the bounded context—do **not** skip the layer “because CRUD is small”.
- The **Service** injects the **Repository** via the constructor; the **Controller** injects only the **Service** (not the repository).
- **Tests**: feature tests still hit HTTP + real layers; unit tests may mock a **repository interface** when you define one.

## Form requests and authorization

- Validate with **Form Request** classes; pass **`$request->validated()`** (or a DTO) into the **Service**, not the raw `Request` for business logic.
- **Policy / gate** checks in the Form Request’s `authorize()` or in the controller before the service—one convention per resource. Do not rely on hiding UI only.

## Dependency flow

- **Controllers** depend on **Services** (constructor injection).
- **Services** depend on **Repositories** (and other services when needed).
- **Repositories** depend on the **model** or `Query\Builder`—never controllers, HTTP, or `Request`.
- **Never** use `app()` to resolve these layers; use constructor type-hints.

## Transactions and side effects

- Open **`DB::transaction()`** in the **Service** when multiple writes must succeed or fail together (the service may call several repository methods inside the transaction).
- **Dispatch jobs**, **events**, and **notifications** from the service (or a listener after an event) after data is committed when consistency matters; see `rules/events-notifications.md`.

## Testing

- **Feature tests** exercise HTTP → controller → service → repository → DB (`LazilyRefreshDatabase`).
- **Unit tests** may mock a **repository interface** or a service boundary as needed.

## Anti-patterns

- **Service** that runs `Expense::query()->create(...)` or `Model::find` instead of delegating to the repository.
- **Fat controller** with queries or `DB::` that belong in service/repository.
- **Anemic repository** that only re-exports every Eloquent method 1:1 with no domain-oriented names—prefer intention-revealing methods (`createForToday`, `forUserOnDate`, …).
- **Service** calling `request()` or reading headers/session; pass explicit inputs from the controller or validated data from the Form Request.
