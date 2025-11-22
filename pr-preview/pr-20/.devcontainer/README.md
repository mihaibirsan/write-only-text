# Development Container Setup

This directory contains the development container configuration for Write Only Text, designed to match the test environment exactly.

## Configuration

### `devcontainer.json`
Single configuration file that uses the Playwright container image directly:
- **Image**: `mcr.microsoft.com/playwright:v1.55.0-noble`
- **User**: `pwuser` (matches Playwright container defaults)
- **Pre-installed**: All browsers and dependencies for Playwright testing

## Features

- **Playwright Ready**: Container comes with all browsers and dependencies pre-installed
- **VS Code Extensions**: Automatically installs Playwright extension and other useful tools
- **Port Forwarding**:
  - 3000: Main application server
  - 3001: Browser Sync development server
  - 9323: Playwright UI mode
- **Git Integration**: Git and GitHub CLI pre-configured
- **NPM Dependencies**: Automatically runs `npm install` after container creation

## Usage

1. **Open in Container**: Use VS Code's "Reopen in Container" command
2. **Run Development Server**: `npm run dev`
3. **Run Tests**: `npm test`
4. **Run Tests in UI Mode**: `npm run test:ui`

## Environment Matching

This setup ensures your development environment exactly matches your CI/test environment by using the same Playwright container image (`mcr.microsoft.com/playwright:v1.55.0-noble`).

## Notes

- The container runs as the `pwuser` user for security and compatibility
- All ports are automatically forwarded for seamless development
- The workspace is mounted with cached consistency for optimal performance
