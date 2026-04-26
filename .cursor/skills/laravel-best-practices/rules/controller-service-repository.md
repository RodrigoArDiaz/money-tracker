# Controller–Service–Repository

Guidance for the layered pattern **Controller → Service → [Repository] → Model / persistence**. In Laravel, **Eloquent is already an abstraction**; a named Repository is optional, not mandatory.

## Consistency first

If the app already uses only **Controller + Service** (Eloquent inside the service), do not add Repository everywhere for consistency with *these* rules — match the project. This file applies when the team has chosen the three-layer pattern or is introducing it deliberately.

## Responsibilities

| Layer | Owns | Avoids |
|-------|------|--------|
| **Controller** | HTTP: route params, `FormRequest`, `authorize`, response (redirect, JSON, `Inertia::render`) | Business rules, complex queries, transactions spanning multiple use cases |
| **Service** | One application use case (or a cohesive subset), orchestration, **transactions** (`DB::transaction`) when the operation spans several steps | Reimplementing Eloquent; duplicating the same 50-line query in many services without shared scopes or repository methods |
| **Repository** (optional) | Reusable read/write for a single aggregate or bounded area; complex queries; swapping persistence for tests or multiple backends | Containing HTTP or authorization; holding domain rules that belong in the model or a dedicated domain layer |

## When to introduce a Repository

- **Add** when the same query/persistence shape is repeated across services, you need a stable contract for unit tests, or you isolate storage behind an interface.
- **Skip** for CRUD that is a thin `Model::create` / `find` — the active record pattern in the Service is idiomatic Laravel unless duplication or testing pressure justifies a Repository.

## Form Requests and authorization

- Validate with **Form Request** classes; pass **`$request->validated()`** (or a DTO) into the Service, not the raw `Request`.
- **Policy / gate checks** can live on the Form Request’s `authorize()` or in the controller before calling the service — pick one place per resource and stay consistent. Do not rely on hiding buttons in the UI only.

## Dependency flow

- Controllers depend on **Services** (constructor injection).
- Services depend on **Repositories** (if used), **other services**, and **Eloquent / contracts** as needed.
- **Repositories** depend on the **model** or `Query\Builder` — not on controllers, HTTP, or `Request`.
- **Never** use `app()` to resolve these layers; use the container via constructor type-hints.

## Transactions and side effects

- Open **`DB::transaction()`** in the **Service** when multiple writes must succeed or fail together.
- **Dispatch jobs**, **events**, and **notifications** from the service (or a listener after an event) after data is committed when consistency matters; use `DB::afterCommit()` or `ShouldDispatchAfterCommit` as appropriate (see `rules/events-notifications.md`).

## Testing

- **Feature tests** hit HTTP + controller + service (and real DB with `LazilyRefreshDatabase`).
- **Unit tests** can mock a **Repository interface** or a **Service** boundary when you need fast, isolated tests; avoid mocking Eloquent in every test unless the indirection is already in the design.

## Anti-patterns

- **Anemic “pass-through” controller** with one line that only calls a service: acceptable if the service name reflects the use case; avoid **anemic service** that only wraps one repository method with no extra behavior — in that case the controller or a single action may be enough.
- **Repository that mirrors every Eloquent method** 1:1 with no real encapsulation.
- **Fat controller** with queries and `DB::` calls that belong in a service.
- **Service calling `request()`** or reading session/headers directly; pass explicit inputs from the controller or validated data from the Form Request.
