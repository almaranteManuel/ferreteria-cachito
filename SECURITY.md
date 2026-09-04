# Security

## Security Principles

- Never trust input from the frontend.
- Never expose secrets to the frontend.
- Validate and sanitize external input.
- Use parameterized SQL queries.
- Minimize Tauri capabilities and permissions.
- Handle errors without exposing sensitive information.
- Keep dependencies updated.
- Never commit credentials, private keys or certificates.
- Protect ARCA credentials and authentication data.

## Areas to Audit

- Tauri IPC and capabilities
- Frontend ↔ Rust communication
- SQLite / SQL injection
- Filesystem access
- Secrets and credentials
- ARCA integration
- Dependency vulnerabilities
- Input validation
- Error handling
- Logging