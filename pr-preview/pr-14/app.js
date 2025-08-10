const { useState, useEffect, useRef } = React;

// Main App Component
function App() {
  // Initialize doc object from localStorage
  const [doc, setDoc] = useState(() => {
    const savedText = window.localStorage.getItem('text') || '';
    const savedStartTime = window.localStorage.getItem('startTime') || null;
    const savedEndTime = window.localStorage.getItem('endTime') || null;
    
    return {
      totalString: savedText,
      startTime: savedStartTime,
      endTime: savedEndTime,
      pluginData: {},
    };
  });

  // Initialize plugin configuration
  const [pluginConfig, setPluginConfig] = useState(() => createPluginConfig());
  const [showPluginSettings, setShowPluginSettings] = useState(false);

  // Handle theme from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const theme = params.get('theme');
    if (theme) {
      document.documentElement.className = theme;
    }
  }, []);

  // Initialize and cleanup plugins when config changes
  useEffect(() => {
    // Cleanup all plugins first
    Object.entries(CORE_PLUGINS).forEach(([key, plugin]) => {
      cleanupPlugin(key, plugin);
    });
    
    // Clear event listeners
    PluginEventEmitter.clear();
    
    // Initialize enabled plugins
    Object.entries(pluginConfig).forEach(([key, config]) => {
      if (config.enabled && CORE_PLUGINS[key]) {
        initializePlugin(key, CORE_PLUGINS[key], config);
      }
    });
  }, [pluginConfig]);

  // Sync plugin config to URL and localStorage
  useEffect(() => {
    syncPluginConfig(pluginConfig);
  }, [pluginConfig]);

  // Save doc to localStorage whenever it changes
  useEffect(() => {
    window.localStorage.setItem('text', doc.totalString);
    if (doc.startTime) {
      window.localStorage.setItem('startTime', doc.startTime);
    }
    if (doc.endTime) {
      window.localStorage.setItem('endTime', doc.endTime);
    }
  }, [doc]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (event) => {
      // Make sure there's focus on the textarea
      const cursorEl = document.getElementById('cursor');
      if (document.activeElement !== cursorEl) {
        cursorEl.focus();
      }

      // Keyboard shortcuts
      // TODO: This should just use an app-level API, currently hidden in the ActionButtons component
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        const copyBtn = document.getElementById('copy');
        if (copyBtn) copyBtn.click();
      } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'x') {
        const clearBtn = document.getElementById('clear');
        if (clearBtn) clearBtn.click();
      } else if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        // Ctrl/Cmd + , opens plugin settings
        event.preventDefault();
        setShowPluginSettings(true);
      }
    };

    // This is to bring up the keyboard on mobile
    const handleClick = () => {
      const cursorEl = document.getElementById('cursor');
      if (cursorEl) cursorEl.focus();
    };

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Scroll cursor into view when doc changes
  useEffect(() => {
    const cursorEl = document.getElementById('cursor');
    if (cursorEl) {
      cursorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [doc]);

  const handleDocChange = (newDoc) => {
    setDoc(newDoc);
  };

  const handleClear = () => {
    const newDoc = {
      totalString: '',
      startTime: null,
      endTime: null,
      pluginData: {},
    };
    setDoc(newDoc);
    window.localStorage.removeItem('startTime');
    window.localStorage.removeItem('endTime');
  };

  // Plugin context value
  const pluginContextValue = {
    config: pluginConfig,
    updateConfig: (pluginKey, newConfig) => {
      setPluginConfig(prev => ({
        ...prev,
        [pluginKey]: { ...prev[pluginKey], ...newConfig }
      }));
    },
    getPluginData: (pluginKey) => doc.pluginData[pluginKey],
    setPluginData: (pluginKey, data) => {
      setDoc(prev => ({
        ...prev,
        pluginData: { ...prev.pluginData, [pluginKey]: data }
      }));
    }
  };

  return (
    <PluginContext.Provider value={pluginContextValue}>
      <div>
        <PluginSlot name="beforeContent" />
        
        <div id="enclosure">
          <TextRenderer doc={doc} />
          <TextInput doc={doc} onDocChange={handleDocChange} />
        </div>

        <PluginSlot name="afterContent" />

        <div id="toolbar">
          <div id="buttons">
            <ActionButtons doc={doc} onClear={handleClear} />
            <TimeDisplay doc={doc} />
            <WordCount doc={doc} />
            <PluginSlot name="toolbar" doc={doc} />
            {' '}
            <button 
              id="plugin-settings-btn"
              onClick={() => setShowPluginSettings(true)}
              title="Plugin Settings (Ctrl+,)"
            >
              ⚙️
            </button>
          </div>
        </div>
        
        <div id="status">
          <OfflineReady />{' '}
          <VersionStatus />
          <PluginSlot name="status" />
        </div>

        <PluginSettings 
          isVisible={showPluginSettings}
          onClose={() => setShowPluginSettings(false)}
        />
      </div>
    </PluginContext.Provider>
  );
}

// Mount the React app
ReactDOM.render(<App />, document.getElementById('app'));
