// Plugin Event System
const PluginEventEmitter = {
  listeners: {},
  
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    if (!this.listeners[event].includes(callback)) {
      this.listeners[event].push(callback);
    }
  },
  
  emit(event, data) {
    if (!this.listeners[event]) return data;
    return this.listeners[event].reduce((acc, callback) => callback(acc), data);
  },
  
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  },
};

// Plugin Context
const PluginContext = React.createContext({
  config: {},
  updateConfig: () => {},
  getPluginData: () => {},
  setPluginData: () => {}
});

// Plugin Slot Component
function PluginSlot({ name, children, ...props }) {
  const { config } = React.useContext(PluginContext);
  
  const pluginComponents = Object.entries(CORE_PLUGINS)
    .filter(([key, plugin]) => plugin.slots?.[name])
    .map(([key, plugin]) => {
      const Component = plugin.slots[name];
      return <Component key={key} {...props} />;
    });
  
  return <>{children}{pluginComponents}</>;
}

// Plugin Configuration Management
function createPluginConfig() {
  // Initialize from localStorage
  const savedConfig = window.localStorage.getItem('pluginConfig');
  return savedConfig ? JSON.parse(savedConfig) : {};
}

function syncPluginConfig(pluginConfig) {
  // Sync to localStorage
  if (Object.keys(pluginConfig).length > 0) {
    window.localStorage.setItem('pluginConfig', JSON.stringify(pluginConfig));
  } else {
    window.localStorage.removeItem('pluginConfig');
  }
}

// Initialize plugins when they are enabled
function initializePlugin(pluginKey, plugin, config, data) {
  if (config.enabled && plugin.initialize) {
    plugin.initialize(PluginEventEmitter, config, data);
  }
}

// Cleanup plugins when they are disabled
function cleanupPlugin(pluginKey, plugin) {
  if (plugin.cleanup) {
    plugin.cleanup(PluginEventEmitter);
  }
}
