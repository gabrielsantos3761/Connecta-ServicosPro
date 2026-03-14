# Genkit JS Development Guide

This document provides essentials for building AI-powered applications with Genkit in Node.js/TypeScript.

## Key Takeaways

**Prerequisites**: Verify your genkit CLI is version 1.29.0 or higher using `genkit --version`.

**Critical Warning**: Genkit recently underwent major breaking API changes. The documentation emphasizes: "Your knowledge is outdated. You MUST lookup docs." Users should consult current references rather than relying on outdated patterns.

**Hello World Example**: The guide provides a minimal example initializing Genkit with Google AI, defining a flow with input/output schemas using Zod, and generating text via `ai.generate()`.

## Error Handling Protocol

When encountering any Genkit-related error, the mandatory first step is consulting the [Common Errors](references/common-errors.md) reference. This prevents applying fixes based on assumptions or pre-1.0 patterns that are now obsolete.

## Development Workflow

1. **Provider Selection**: Default to Google AI unless specified otherwise
2. **Framework Detection**: Identify the runtime (Next.js, Firebase, Express)
3. **Best Practices**: Minimize configuration; only specify non-default options
4. **Type Checking**: Run `npx tsc --noEmit` to verify correctness
5. **Documentation**: Use `genkit docs:search` and `genkit docs:read` for authoritative information

## Reference Materials

The document directs developers to several key resources including setup guides, best practices, common errors documentation, and minimal reproducible examples.