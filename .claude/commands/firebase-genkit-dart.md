# Genkit Dart SDK Overview

Genkit Dart is an AI SDK designed for Dart that provides "a unified interface for code generation, structured outputs, tools, flows, and AI agents."

## Key Components

**Core Framework:** The SDK handles initialization, generation, tooling, flows, embeddings, and streaming capabilities.

**Developer Tools:** The Genkit CLI offers a local development environment for executing flows, tracing executions, and evaluating outputs. Installation is available via native script or npm, and it attaches to your Dart application with `genkit start -- dart run main.dart`.

**Plugin System:** The ecosystem includes eight major plugins:
- Google Gemini (genkit_google_genai)
- Anthropic Claude (genkit_anthropic)
- OpenAI/GPT (genkit_openai)
- Middleware for agentic behavior (genkit_middleware)
- Model Context Protocol (genkit_mcp)
- Chrome/Gemini Nano (genkit_chrome)
- HTTP integration via Shelf (genkit_shelf)
- Firebase AI (genkit_firebase_ai)

**Schema Support:** The schemantic library is required for type-safe data modeling in tools, flows, and prompts.

## Development Recommendations

Use the Genkit CLI for debugging and local testing. Always validate code compilation with `dart analyze` before finalizing implementations.