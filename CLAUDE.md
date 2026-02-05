# MCP Tools Available

This project has access to Model Context Protocol (MCP) tools that should be used when working with the codebase:

## Serena (Semantic Codebase Agent)

- **Purpose**: Deep semantic understanding of the codebase, symbol navigation, and token-efficient code modification
- **When to use**:
  - **INSTEAD** of reading entire files or using `grep` when you need to find specific functionality
  - When you need to find where a class, function, or variable is defined or used (`find_symbol`)
  - When analyzing complex dependencies between different parts of the project
  - When you need to understand the project structure without dumping file contents into context
- **How to use**:
  - **Initialization**: At the start of a session, if Serena doesn't seem active, ask: *"Read Serena's initial instructions"*
  - **Workflow**: Ask to "Activate the project at [current path]" if it's the first time running in this directory
  - **Action**: Use Serena's tools to "map" or "index" the relevant code sections before proposing changes

## Development Workflow & Quality Assurance

Before finishing any task or committing changes, you MUST execute the following steps:

1. **Verify Tests**: Run `npm test -- --run` to ensure all tests pass (non-interactive).
2. **Check Coverage**: Run `npm run test:coverage -- --run` and confirm 100% test coverage.
3. **Format Code**: Run `npm run format` to ensure code style compliance.

**Constraint**: Do not consider work finished until all tests pass, coverage is 100%, and code is formatted.

