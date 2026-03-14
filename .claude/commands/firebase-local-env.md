# Firebase Local Environment Setup

This documentation outlines the essential prerequisites for Firebase development. Here's a concise overview:

## Core Requirements

**Node.js (v20+)**: Verify installation with `node --version`. The guide recommends using a version manager (nvm for macOS/Linux, nvm-windows for Windows) to avoid permission issues.

**Firebase CLI**: Test availability by running `npx -y firebase-tools@latest --version` to confirm the tool functions properly.

**Authentication**: Execute `npx -y firebase-tools@latest login` to authenticate, or use the `--no-localhost` flag for restricted environments without browser access.

**Agent-Specific Setup**: The final critical step requires reviewing the appropriate setup document based on your agent environment (Gemini CLI, Antigravity, Claude Code, Cursor, GitHub Copilot, or other agents).

## Key Constraint

The documentation emphasizes: "Do NOT proceed with any other Firebase tasks until EVERY step above has been successfully verified and completed." This sequential approach ensures a fully functional local environment before attempting Firebase operations.