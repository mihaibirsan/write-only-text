# Plugin System Documentation

## Overview

Write Only Text includes a composable plugin system that allows users to enable/disable features based on their preferred workflow. The system uses a hybrid approach combining event-driven architecture with slot-based UI composition.

## Architecture

### Files Structure
```
plugins/
├── pluginSystem.js     # Core plugin infrastructure
└── corePlugins.js      # Built-in plugins

components.js           # React components with plugin support
utils.js               # Utility functions
app.js                 # Main application with plugin integration
```

### Key Components

1. **Plugin Event System** (`PluginEventEmitter`)
   - Event-driven communication between plugins and components
   - Events: `render:text`, `validate:input`

2. **Plugin Context** (`PluginContext`)
   - React context for sharing plugin state
   - Provides: `config`, `updateConfig`

3. **Plugin Slots** (`PluginSlot`)
   - UI injection points for plugin components
   - Slots: `toolbar`, `settings`

## Built-in Plugins

### Syntax Highlighting
- **Purpose**: Adds visual styling using highlight.js markdown syntax highlighting
- **Affects**: Text rendering only
- **Features**: Full markdown syntax highlighting via highlight.js library
- **Settings**: Enable/disable toggle
- **Dependencies**: highlight.js CDN (automatically loaded)

### Pomodoro Timer
- **Purpose**: Time-limited writing sessions with focus periods
- **Affects**: Input validation and toolbar display
- **Features**: Configurable duration, input blocking when expired, live timer display
- **Settings**: Enable/disable, duration selection (15/25/45/60 minutes)

## Configuration

### localStorage
Settings persist locally between sessions using the `pluginConfig` key.

### Keyboard Shortcuts
- `Ctrl/Cmd + ,`: Open plugin settings modal

## Plugin Development

### Plugin Structure
```javascript
const EXAMPLE_PLUGIN = {
  name: 'Plugin Name',
  description: 'Plugin description',
  defaultConfig: { 
    enabled: false,
    customSetting: 'value'
  },
  
  // Lifecycle hooks
  initialize(eventEmitter, config, data) {
    // Save configuration as it were when initialized
    this.config = config;
    // Access to doc state via data.doc
    this.initialDoc = data.doc;
    // Set up event listeners
    this._boundHandler = this.handler.bind(this);
    eventEmitter.on('render:text', this._boundHandler);
  },
  
  cleanup(eventEmitter) {
    // Clean up event listeners
    eventEmitter.off('render:text', this._boundHandler);
  },
  
  // UI slots
  slots: {
    toolbar: () => <PluginComponent />,
    settings: () => <PluginSettings />
  }
};
```

### Event System
Plugins can listen to and transform data via events:

- `render:text`: Transform text content for display
- `validate:input`: Validate or block user input

### Adding New Plugins
1. Add plugin definition to `CORE_PLUGINS` in `corePlugins.js`
2. Implement required methods and slots
3. Plugin will automatically appear in settings UI

### Dependencies
- React 18 (CDN)
- highlight.js (CDN, for syntax highlighting plugin)
- Luxon (CDN, for time utilities)
- Babel standalone (CDN, for JSX compilation)

## Design Principles

1. **Inversion of Control**: Plugins compose with components rather than components knowing about plugins
2. **Event-Driven**: Loose coupling through event system
3. **Slot-Based UI**: Clean separation of plugin UI from core components
4. **Persistent Configuration**: Plugin settings automatically saved to localStorage
5. **No Build Tools**: Maintains CDN-based architecture

Currently out of scope:
1. **URL Shareable**: Configuration easily shared via URL parameters

## Future Extensions

The plugin system is designed to be extensible. Potential future plugins:
- Word goal tracking
- Auto-save intervals
- Export formats (e.g. Markdown, HTML, PDF)
- Writing analytics
- Focus modes
- Distraction blocking
- Theme customization
- Text statistics
