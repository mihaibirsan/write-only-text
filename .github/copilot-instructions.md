# AI Coding Agent Instructions

## Project Overview
Write Only Text is a distraction-free writing app with a unique constraint: text can only be appended (no editing except backspace). The app recently transitioned from vanilla JavaScript to React while maintaining CDN-based dependencies and no build tools.

## Architecture Patterns

### Input/Render Decoupling
**Critical architectural decision**: Input and rendering are completely separated for performance and UX reasons.

- `TextInput` component: Hidden textarea (`#cursor`) captures all keystrokes
- `TextRenderer` component: Displays text in a separate div (`#text`)
- Both components share state through the `doc` object but serve different purposes

```javascript
// TextInput handles input, TextRenderer handles display
<TextInput doc={doc} onDocChange={handleDocChange} />
<TextRenderer doc={doc} />
```

### Doc Object Data Model
All text state is centralized in a `doc` object with three properties:
```javascript
{
  totalString: string,    // The actual text content
  startTime: string|null, // ISO timestamp when first keystroke occurred
  endTime: string|null    // ISO timestamp of last keystroke
}
```

### No Build Tools Philosophy
- Uses React via CDN with Babel standalone for JSX transformation
- Scripts loaded with `type="text/babel"` for JSX compilation
- Dependencies: React 18, Luxon for time handling, Babel standalone

## Key Components

### App Component
- Manages global `doc` state and localStorage persistence
- Handles keyboard shortcuts (Ctrl+C copy, Ctrl+Shift+X clear)
- Manages focus behavior (click anywhere focuses textarea)
- Applies theme from URL parameters (`?theme=mauve`)

### TextInput Component
- Uses `useRef` for direct DOM manipulation (selection, focus)
- Automatically sets `startTime` on first keystroke
- Updates `endTime` on every keystroke
- Maintains cursor at end of text via `selectionchange` event

### Utility Functions
Time formatting follows Zettelkasten ID pattern:
- `timeStringToZettelID()`: Converts ISO timestamp to compressed ID
- `zettelIDPretty()`: Formats ID with styled spans for display

## Development Workflow

### Local Development
```bash
npm run dev  # Starts browser-sync with live reload
```

### Key Development Features
- Browser-sync middleware modifies HTML to show current git branch in badge
- Service worker caches app for offline use
- Mobile debugging support via Chrome DevTools remote debugging

### File Structure
```
├── app.js              # React components (CDN-based, no build)
├── index.html          # Main HTML with CDN script tags
├── style.css           # Styling with theme support
├── service-worker.js   # Offline caching
├── scripts/
│   ├── browser-sync-config.js  # Dev server with middleware
│   └── build-badge.js          # Badge generation
```

## CSS Architecture
- Fixed positioning for toolbar (bottom) and status (bottom-right)
- Responsive design with 40em max-width content
- Theme system via CSS classes (e.g., `.mauve` theme)
- Hidden textarea with `opacity: 0` for input capture

## State Management Patterns
- localStorage automatically syncs with `doc` object changes
- Component state flows unidirectionally: App → child components
- No external state management library needed

## Testing & Debugging
- Focus management critical for mobile UX
- Test keyboard shortcuts work across components
- Verify localStorage persistence across sessions
- Check service worker caching for offline functionality

## Integration Points
- Luxon library for timestamp generation
- Native Web Share API for sharing functionality
- Service Worker for offline capabilities
- localStorage for state persistence

## Mobile Considerations
- Interactive widget resize handling in viewport meta tag
- Click-to-focus behavior for mobile keyboards
- Touch-friendly button sizing and positioning
