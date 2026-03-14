# Firebase AI Logic Skill Overview

Firebase AI Logic enables developers to integrate Gemini models directly into web and mobile applications without backend infrastructure. Here are the key points:

## Setup & Getting Started

You'll need Node.js 16+ and npm. Installation uses the standard Firebase Web SDK:

```
npm install -g firebase@latest
npx -y firebase-tools@latest init # Choose AI logic
```

This automatically enables the Gemini Developer API in your Firebase console.

## Core Capabilities

The platform supports:
- **Text generation** and multimodal analysis (images, audio, video, PDFs)
- **Chat sessions** with automatic history management via `startChat`
- **Streaming responses** using `generateContentStream` for real-time display
- **Structured JSON output** with schema enforcement
- **Image generation** with Imagen (requires Blaze plan)
- **Search grounding** via built-in Google Search tool

## API Providers

Choose based on your needs:
- **Gemini Developer API**: Free tier for prototyping, pay-as-you-go for production
- **Vertex AI Gemini API**: Enterprise-grade, requires Blaze plan

The documentation recommends "use the Gemini Developer API as a default, and only Vertex AI Gemini API if the application requires it."

## Best Practices

- Use the latest Gemini model (`gemini-flash-latest`) unless otherwise specified
- Enable **App Check** with reCAPTCHA Enterprise to protect API quotas
- Leverage **Remote Config** to update model versions without redeploying client code
- For files over 20MB, store in Cloud Storage for Firebase rather than sending as inline data