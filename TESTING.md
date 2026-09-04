# Testing

## Purpose

Cachito must use automated tests to prevent regressions and verify critical business behavior.

## Testing Strategy

Tests are organized into:

- Unit tests: business logic and isolated functions.
- Integration tests: interaction between services, repositories and SQLite.
- End-to-end tests: critical user workflows.

## Priorities

Tests should prioritize:

1. Sales and purchases
2. Inventory and stock
3. Payments and cash register
4. Customers
5. Invoicing and ARCA
6. Database integrity
7. Security-sensitive behavior

## Rules

- New business logic should include tests.
- Bug fixes should include regression tests when practical.
- Tests must verify behavior, not implementation details.
- Do not remove or weaken tests to make code pass.
- Tests must be deterministic and independent.
- Database integration tests should use an isolated test database.
- Critical multi-step operations must test rollback behavior.

## Before Finishing a Task

Run the relevant test suite and verify:

- Tests pass.
- The project compiles.
- No existing tests were broken.
- New behavior is covered when appropriate.