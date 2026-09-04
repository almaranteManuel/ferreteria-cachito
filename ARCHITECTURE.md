# Architecture

## Overview

Cachito is a desktop ERP application built with Tauri v2, React, TypeScript, Rust and SQLite.

The application follows a layered architecture with clear separation between presentation, IPC, business logic and data access.

## Layers

### Frontend
- React + TypeScript
- UI components and user interaction
- Communicates with the backend through Tauri IPC

### Command Layer
Location: `src-tauri/src/commands/`

- Tauri IPC entry points
- Receives and validates input
- Accesses application state
- Delegates operations to services
- Must not contain business logic or raw SQL

### Service Layer
Location: `src-tauri/src/services/`

- Contains business logic
- Validates business rules
- Performs calculations
- Orchestrates repositories and business operations

### Repository Layer
Location: `src-tauri/src/repositories/`

- Database access
- SQL queries
- CRUD operations
- Database transactions

### Model Layer
Location: `src-tauri/src/models/`

- Domain and data structures
- Serialization/deserialization

## Dependency Flow

Frontend
→ Tauri IPC
→ Commands
→ Services
→ Repositories
→ SQLite

Dependencies should flow in this direction.

## Persistence

- SQLite is the local source of truth.
- `sqlx` is used for database access.
- Schema changes are managed through migrations.
- Operations requiring atomicity must use transactions.

## External Services

ARCA/AFIP is the only external service required for electronic invoicing.

The application must remain functional offline except for operations that explicitly require ARCA connectivity.

## Architectural Invariants

- Frontend must not access SQLite directly.
- Commands must not contain business logic.
- Services must contain business rules.
- Repositories must be responsible for SQL.
- Database schema changes must use migrations.
- Critical multi-step operations must be atomic.
- ARCA credentials and private keys must never reach the frontend.
- Architectural changes require explicit review.