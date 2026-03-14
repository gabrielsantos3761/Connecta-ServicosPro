# Firebase Authentication Basics Guide

## Overview
Firebase Authentication offers backend services and SDKs for authenticating users. The system identifies each user with a unique ID (`uid`) and supports multiple sign-in methods including email/password, federated providers (Google, Facebook, etc.), phone number, anonymous, and custom authentication.

## Key User Properties
Users have five main attributes: a unique identifier, email address, display name, photo URL, and email verification status.

## Authentication Methods
"Firebase Auth supports multiple ways to sign in" including email/password, federated identity providers like Google and Facebook, SMS-based phone authentication, anonymous guest accounts, and custom integrations with existing systems.

## Token System
Upon sign-in, users receive an ID Token (JWT) for identifying themselves to Firebase services. The system uses two token types: short-lived ID tokens valid for one hour, and long-lived refresh tokens for obtaining new credentials.

## Setup Options
Configuration can occur via CLI (supporting Google Sign-In, anonymous, and email/password) or through the Firebase Console for additional providers. The CLI method requires updating `firebase.json` with provider settings.

## Security Implementation
Data protection uses `request.auth` within Firestore and Storage security rules to enforce access controls based on authentication status.