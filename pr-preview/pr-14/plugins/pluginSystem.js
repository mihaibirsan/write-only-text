// Plugin Event System
const PluginEventEmitter = {
  listeners: {},
  
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
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
  
  clear() {
    this.listeners = {};
  }
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
  // Initialize from URL params first, then localStorage
  const params = new URLSearchParams(location.search);
  const urlPlugins = params.get('plugins');
  
  if (urlPlugins) {
    try {
      return JSON.parse(decodeURIComponent(urlPlugins));
    } catch (e) {
      console.warn('Invalid plugins URL parameter');
    }
  }
  
  const savedConfig = window.localStorage.getItem('pluginConfig');
  return savedConfig ? JSON.parse(savedConfig) : {};
}

function syncPluginConfig(pluginConfig) {
  // Sync to URL
  const params = new URLSearchParams(location.search);
  if (Object.keys(pluginConfig).length > 0) {
    params.set('plugins', encodeURIComponent(JSON.stringify(pluginConfig)));
  } else {
    params.delete('plugins');
  }
  
  const newUrl = `${location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
  
  // Sync to localStorage
  if (Object.keys(pluginConfig).length > 0) {
    window.localStorage.setItem('pluginConfig', JSON.stringify(pluginConfig));
  } else {
    window.localStorage.removeItem('pluginConfig');
  }
}

// Initialize plugins when they are enabled
function initializePlugin(pluginKey, plugin, config) {
  if (config.enabled && plugin.initialize) {
    plugin.initialize(PluginEventEmitter, config);
  }
}

// Cleanup plugins when they are disabled
function cleanupPlugin(pluginKey, plugin) {
  if (plugin.cleanup) {
    plugin.cleanup(PluginEventEmitter);
  }
}
