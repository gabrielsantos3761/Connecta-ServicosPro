# Firebase Basics Overview

This guide covers fundamental Firebase setup and workflow for AI agents. Here are the key steps:

## Authentication & Project Setup

First, authenticate with Firebase using "npx -y firebase-tools@latest login" (or add `--no-localhost` for remote environments). Then create a project with `npx -y firebase-tools@latest projects:create`, providing a globally unique Project ID and display name.

## Initialization

Initialize Firebase in your project directory by running `npx -y firebase-tools@latest init`, which guides you through selecting features like Firestore, Functions, and Hosting, then configures necessary files.

## Discovery Through CLI Help

The Firebase CLI includes built-in documentation. Use "npx -y firebase-tools@latest --help" for all available commands, or "npx -y firebase-tools@latest [command] --help" for specific command details (such as `deploy --help`).

## Prerequisites

This skill assumes you've already completed the `firebase-local-env-setup` skill and have the Firebase CLI and Firebase MCP server installed.

## Additional Resources

For web app integration, refer to the Web SDK setup guide in the references section.