// Core Plugins Registry
const CORE_PLUGINS = {
  syntaxHighlighting: {
    name: 'Syntax Highlighting',
    description: 'Adds syntax coloring to text using highlight.js markdown syntax',
    defaultConfig: {
      enabled: false,
    },
    component: SyntaxHighlightingPlugin,
    slots: {
      settings: SyntaxHighlightingSettings
    }
  },

  pomodoroTimer: {
    name: 'Pomodoro Timer',
    description: 'Time-limited writing sessions with focus periods',
    defaultConfig: {
      enabled: false,
      duration: 25 * 60 * 1000, // 25 minutes in ms
    },
    component: PomodoroTimerPlugin,
    slots: {
      toolbar: PomodoroDisplay,
      settings: PomodoroSettings
    }
  }
};

const { useContext, useEffect, useRef, useState } = React;

// Syntax Highlighting Plugin Component
function SyntaxHighlightingPlugin({ config, doc }) {
  useEffect(() => {
    // Only install handler when the plugin is enabled
    if (!config.enabled) return;

    // Check if highlight.js is available
    if (typeof hljs === 'undefined') {
      console.warn('highlight.js not loaded, falling back to plain text');
      return;
    }

    const applySyntaxHighlighting = (text) => {

      try {
        // Use highlight.js to highlight the entire text as markdown
        const highlighted = hljs.highlight(text, { language: 'markdown' });
        return `<span class="hljs">${highlighted.value}</span>`;
      } catch (e) {
        console.warn('Error highlighting with highlight.js:', e);
        return text;
      }
    };

    const renderHandler = (data) => {
      return {
        content: applySyntaxHighlighting(data.content),
        isHTML: true
      };
    };

    PluginEventEmitter.on('render:text', renderHandler);

    return () => {
      PluginEventEmitter.off('render:text', renderHandler);
    };
  }, [config.enabled]);

  return null; // This plugin doesn't render any UI, only handles events
}

// Syntax Highlighting Settings Component
function SyntaxHighlightingSettings() {
  const { config, updateConfig } = useContext(PluginContext);
  const pluginConfig = config.syntaxHighlighting || {};

  return (
    <div className="plugin-setting">
      <label>
        <input
          type="checkbox"
          checked={pluginConfig.enabled || false}
          onChange={(e) => updateConfig('syntaxHighlighting', {
            ...pluginConfig,
            enabled: e.target.checked
          })}
        />
        {' '}Syntax Highlighting
      </label>
      <p className="plugin-description">
        Adds markdown syntax highlighting using highlight.js
      </p>
    </div>
  );
}

// Pomodoro Timer Plugin Component
function PomodoroTimerPlugin({ config, doc }) {
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    startTimeRef.current = doc.startTime ? new Date(doc.startTime).getTime() : null;
  }, [doc.startTime]);

  useEffect(() => {
    // Only install handler when the plugin is enabled
    if (!config.enabled) return;

    const getTimeRemaining = () => {
      if (!startTimeRef.current) return config?.duration || 0;
      const timeElapsed = Date.now() - startTimeRef.current;
      return Math.max(0, (config?.duration || 0) - timeElapsed);
    };

    const validateHandler = (data) => {
      if (!config.enabled) return data;

      // Start timer if doc has startTime but plugin hasn't started yet
      if (data.doc.startTime && !startTimeRef.current) {
        startTimeRef.current = new Date(data.doc.startTime).getTime();
      }

      // Reset startTime if it was cleared
      if (!data.doc.startTime) {
        startTimeRef.current = null;
      }

      if (getTimeRemaining() === 0) {
        return { ...data, allowed: false, reason: 'Pomodoro session complete' };
      }

      return data;
    };

    PluginEventEmitter.on('validate:input', validateHandler);
    intervalRef.current = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);

      // Trigger re-render of timer display via custom event
      const event = new CustomEvent('pomodoro:tick');
      document.dispatchEvent(event);
    }, 1000);

    return () => {
      PluginEventEmitter.off('validate:input', validateHandler);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [config.enabled, config.duration]);

  return null; // This plugin doesn't render any UI directly, only handles events
}

// Utility function
const formatTime = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Pomodoro Timer Display Component
function PomodoroDisplay() {
  const { config } = useContext(PluginContext);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      // We need to calculate time remaining here since we don't have access to the plugin instance
      const pluginConfig = config.pomodoroTimer;
      if (!pluginConfig?.enabled) return;

      const startTime = window.localStorage.getItem('startTime');
      if (!startTime) {
        setTimeRemaining(pluginConfig.duration || 0);
        return;
      }

      const timeElapsed = Date.now() - new Date(startTime).getTime();
      const remaining = Math.max(0, (pluginConfig.duration || 0) - timeElapsed);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const handleTick = () => updateTimer();
    document.addEventListener('pomodoro:tick', handleTick);

    return () => {
      document.removeEventListener('pomodoro:tick', handleTick);
    };
  }, [config.pomodoroTimer]);

  if (!config.pomodoroTimer?.enabled) return null;

  const isExpired = timeRemaining === 0;

  return (
    <span
      id="pomodoro-timer"
      className={isExpired ? 'expired' : 'active'}
    >
      {isExpired ? '⏰ Session Complete' : `⏱️ ${formatTime(timeRemaining)}`}
    </span>
  );
}

// Pomodoro Settings Component
function PomodoroSettings() {
  const { config, updateConfig } = useContext(PluginContext);
  const defaultConfig = CORE_PLUGINS.pomodoroTimer.defaultConfig;
  const pluginConfig = config.pomodoroTimer || {};

  return (
    <div className="plugin-setting">
      <label>
        <input
          type="checkbox"
          checked={pluginConfig.enabled || false}
          onChange={(e) => updateConfig('pomodoroTimer', {
            ...defaultConfig,
            ...pluginConfig,
            enabled: e.target.checked
          })}
        />
        {' '}Pomodoro Timer
      </label>
      <p className="plugin-description">
        Limits writing sessions to focused time periods
      </p>
      {pluginConfig.enabled && (
        <div className="plugin-options">
          <label>
            Duration:{' '}
            <select
              value={pluginConfig.duration || 25 * 60 * 1000}
              onInput={(e) => updateConfig('pomodoroTimer', {
                ...pluginConfig,
                duration: parseInt(e.target.value)
              })}
            >
              <option value={ 5 * 60 * 1000}> 5 minutes</option>
              <option value={10 * 60 * 1000}>10 minutes</option>
              <option value={15 * 60 * 1000}>15 minutes</option>
              <option value={25 * 60 * 1000}>25 minutes</option>
              <option value={45 * 60 * 1000}>45 minutes</option>
              <option value={60 * 60 * 1000}>60 minutes</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
