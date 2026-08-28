const { useState, useEffect, useMemo, useRef } = React;

// Convenience API for document History
const HistoryAPI = {
  getAllItems: () => {
    const items = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      try {
        const item = JSON.parse(window.localStorage.getItem(key));
        if (item && item.uuid) {
          items.push(item);
        }
      } catch (e) {
        // Ignore non-JSON items
      }
    }
    // Sort by most recent (assuming endTime is a timestamp)
    items.sort((a, b) => {
      const timeA = a.endTime ? new Date(a.endTime).getTime() : 0;
      const timeB = b.endTime ? new Date(b.endTime).getTime() : 0;
      return timeB - timeA;
    });
    return items;
  },
  clearItemsOlderThan7Days: () => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      try {
        const item = JSON.parse(window.localStorage.getItem(key));
        if (item && item.uuid && item.endTime) {
          const itemTime = new Date(item.endTime).getTime();
          if (now - itemTime > sevenDays) {
            window.localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // Ignore non-JSON items
      }
    }
  },
};

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

  // Sync plugin config to localStorage
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
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === 'x'
      ) {
        const clearBtn = document.getElementById('clear');
        if (clearBtn) clearBtn.click();
      } else if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        // Ctrl/Cmd + , opens plugin settings
        event.preventDefault();
        setShowPluginSettings(true);
      }
    };

    // This is to bring up the keyboard on mobile
    const handleClick = (event) => {
      if (event?.target.closest('#plugin-settings')) return;
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
    // Push history item
    const uuid = crypto.randomUUID();
    const historyItem = {
      uuid,
      ...doc,
    };
    window.localStorage.setItem(uuid, JSON.stringify(historyItem));

    // Actually clear
    const newDoc = {
      totalString: '',
      startTime: null,
      endTime: null,
    };
    setDoc(newDoc);
    window.localStorage.removeItem('startTime');
    window.localStorage.removeItem('endTime');
    PluginEventEmitter.emit('validate:input', { doc: newDoc });
  };

  // Plugin context value
  const pluginContextValue = {
    config: pluginConfig,
    updateConfig: (pluginKey, newConfig) => {
      setPluginConfig((prev) => ({
        ...prev,
        [pluginKey]: { ...prev[pluginKey], ...newConfig },
      }));
    },
  };

  return (
    <PluginContext.Provider value={pluginContextValue}>
      <div>
        <PluginManager doc={doc} />

        <div id="enclosure">
          <TextRenderer doc={doc} />
          <TextInput doc={doc} onDocChange={handleDocChange} />
        </div>

        <div id="toolbar">
          <div id="buttons">
            <ActionButtons doc={doc} onClear={handleClear} />
            <PluginSlot name="toolbar" doc={doc} />
            <TimeDisplay doc={doc} />
            <WordCount doc={doc} />{' '}
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
          <OfflineReady /> <VersionStatus />
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
