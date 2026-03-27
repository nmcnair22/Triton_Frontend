# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Triton V3 is a Vue 3-based frontend application for field services management, dispatch operations, and business administration. It features multi-tenant authentication, comprehensive dashboards, and integrates with backend APIs for various business operations.

## Tech Stack

- **Framework**: Vue 3.5.17 with Composition API
- **State Management**: Pinia 3.0.3
- **Routing**: Vue Router
- **Build Tool**: Vite
- **UI Components**: PrimeVue 4.3.5
- **Styling**: Tailwind CSS 3.4.7, SCSS
- **HTTP Client**: Axios 1.10.0
- **Authentication**: Multi-provider (Microsoft, Apple, Google)
- **Real-time**: Laravel Echo with Pusher

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

## Architecture

### Directory Structure

- `src/views/` - Page-level components organized by feature area
- `src/components/` - Reusable Vue components
- `src/stores/` - Pinia stores for state management
- `src/router/` - Vue Router configuration
- `src/service/` - API service classes (note: singular 'service')
- `src/auth/` - Authentication services and utilities
- `src/utils/` - Utility functions and helpers
- `src/assets/` - Static assets, styles, and fonts
- `src/layout/` - Layout wrapper components

### State Management (Pinia)

Stores follow a consistent pattern using composition API:
- Located in `src/stores/`
- Each store manages a specific domain (users, customers, billing, etc.)
- Common structure includes state refs, computed getters, and async actions
- All stores include error handling and loading states

Key stores:
- `userStore.js` - User authentication and profile
- `dispatchStore.js` - Dispatch operations and analytics
- `customerStore.js` - Customer data management
- `billingStore.js` - Billing and invoice operations
- `locationStore.js` - Location and site management

### API Integration

All API calls go through centralized services:
- Base service: `src/service/ApiService.js`
- Base URL: Environment variable `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api`)
- Authentication: Bearer token automatically added via Axios interceptor
- Token management: `AuthService.getToken()` and `AuthService.clearSession()`
- Error handling: 401 responses trigger session cleanup and redirect to login

### Routing

- Main router configuration: `src/router/index.js`
- Protected routes use `requiresAuth` meta field
- Default redirect: `/field-services/visit-management`
- Layout wrappers: `AppLayout`, `AuthLayout`, `LandingLayout`

### Environment Configuration

Set environment variables:
- `VITE_API_BASE_URL` - Backend API base URL
- `PORT` - Development server port (default: 3000)

### Component Patterns

- Use PrimeVue components (auto-imported)
- Follow existing component structure in the codebase
- Leverage Tailwind CSS for styling
- Use composition API for new components

## Code Style Guidelines

- ESLint configuration enforced via `npm run lint`
- Prettier formatting via `npm run format`
- Use `@` alias for imports from `src/` directory
- Async/await for API calls with proper error handling
- Consistent error and loading state management in stores

## Important Notes

- No test framework currently configured
- Authentication tokens stored in localStorage/sessionStorage
- Real-time updates via Laravel Echo/Pusher
- Multi-tenant architecture with role-based access control
- Extensive logging in development mode for API calls