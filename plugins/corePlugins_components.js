const { useCallback, useContext, useEffect, useRef, useState } = React;

// Syntax Highlighting Plugin Component
function SyntaxHighlightingPlugin({ config, doc }) {
  const renderHandler = useCallback((data) => {
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

    return {
      content: applySyntaxHighlighting(data.content),
      isHTML: true
    };
  }, []);

  /**
   * NOTE: This is a bit of a hack to ensure the event listener is registered
   * before the first render. Ideally, the render pipeline would use reactivity
   * instead of events, such that when adding a new plugin, it would re-render.
   * See: Plugin Architecture Render Pipeline #19
   */
  useMemo(() => {
    if (config.enabled) {
      PluginEventEmitter.on('render:text', renderHandler);
    }
  }, [config]);

  useEffect(() => {
    return () => PluginEventEmitter.off('render:text', renderHandler);
  }, [config]);

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
