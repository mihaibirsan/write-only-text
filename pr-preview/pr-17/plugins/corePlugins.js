// Core Plugins Registry
const CORE_PLUGINS = {
  syntaxHighlighting: {
    name: 'Syntax Highlighting',
    description: 'Adds syntax coloring to text using highlight.js markdown syntax',
    defaultConfig: { 
      enabled: false, 
    },
    
    initialize(eventEmitter, config, data) {
      this.config = config;
      // Register text rendering transformer
      if (!this._boundRenderHandler) {
        this._boundRenderHandler = this.renderHandler.bind(this);
      }
      eventEmitter.on('render:text', this._boundRenderHandler);
    },

    renderHandler(data) {
        if (!this.config.enabled) return data;
        
        return {
          content: this.applySyntaxHighlighting(data.content, this.config),
          isHTML: true
        };
    },

    cleanup(eventEmitter) {
      // Remove all listeners for this plugin
      eventEmitter.off('render:text', this._boundRenderHandler);
    },
    
    applySyntaxHighlighting(text, config) {
      // Check if highlight.js is available
      if (typeof hljs === 'undefined') {
        console.warn('highlight.js not loaded, falling back to plain text');
        return text;
      }
      
      try {
        // Use highlight.js to highlight the entire text as markdown
        const highlighted = hljs.highlight(text, { language: 'markdown' });
        return `<span class="hljs">${highlighted.value}</span>`;
      } catch (e) {
        console.warn('Error highlighting with highlight.js:', e);
        return text;
      }
    },
    
    slots: {
      settings: function SyntaxHighlightingSettings() {
        const { config, updateConfig } = React.useContext(PluginContext);
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
    }
  },

  pomodoroTimer: {
    name: 'Pomodoro Timer',
    description: 'Time-limited writing sessions with focus periods',
    defaultConfig: { 
      enabled: false, 
      duration: 25 * 60 * 1000, // 25 minutes in ms
    },
    
    initialize(eventEmitter, config, data) {
      this.config = config;
      this.startTime = data.doc.startTime ? new Date(data.doc.startTime).getTime() : null;
      this.intervalId = null;
      this.startInterval();
      
      // Validate input based on timer
      if (!this._boundValidateHandler) {
        this._boundValidateHandler = this.validateHandler.bind(this);
      }
      eventEmitter.on('validate:input', this._boundValidateHandler);
    },

    validateHandler(data) {
      if (!this.config.enabled) return data;
      
      // Start timer if doc has startTime but plugin hasn't started yet
      if (data.doc.startTime && !this.startTime) {
        this.startTime = new Date(data.doc.startTime).getTime();
      }
      
      // Reset startTime if it was cleared
      if (!data.doc.startTime) {
        this.startTime = null;
      }
      
      if (this.getTimeRemaining() === 0) {
        return { ...data, allowed: false, reason: 'Pomodoro session complete' };
      }
      
      return data;
    },
    
    cleanup(eventEmitter) {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.startTime = null;
      eventEmitter.off('validate:input', this._boundValidateHandler);
    },
    
    startInterval() {
      this.intervalId = setInterval(() => {
        // Trigger re-render of timer display
        const event = new CustomEvent('pomodoro:tick');
        document.dispatchEvent(event);
      }, 1000);
    },
    
    getTimeRemaining() {
      if (!this.startTime) return this.config?.duration || 0;
      const timeElapsed = Date.now() - this.startTime;
      return Math.max(0, (this.config?.duration || 0) - timeElapsed);
    },
    
    formatTime(ms) {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
    
    slots: {
      toolbar: function PomodoroDisplay() {
        const { config } = React.useContext(PluginContext);
        const [timeRemaining, setTimeRemaining] = React.useState(0);
        const pluginInstance = CORE_PLUGINS.pomodoroTimer;
        
        React.useEffect(() => {
          const updateTimer = () => {
            setTimeRemaining(pluginInstance.getTimeRemaining());
          };
          
          updateTimer();
          const handleTick = () => updateTimer();
          document.addEventListener('pomodoro:tick', handleTick);
          
          return () => {
            document.removeEventListener('pomodoro:tick', handleTick);
          };
        }, []);
        
        if (!config.pomodoroTimer?.enabled) return null;
        
        const isExpired = timeRemaining === 0;
        
        return (
          <span 
            id="pomodoro-timer"
            className={isExpired ? 'expired' : 'active'}
          >
            {isExpired ? '⏰ Session Complete' : `⏱️ ${pluginInstance.formatTime(timeRemaining)}`}
          </span>
        );
      },
      
      settings: function PomodoroSettings() {
        const { config, updateConfig } = React.useContext(PluginContext);
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
    }
  },

  themeSelector: {
    slots: {
      settings: function ThemeSelectorSettings() {
        const query = new URLSearchParams(window.location.search);
        const currentTheme = query.get('theme') || 'default';
        query.delete('theme');
        const baseQuery = query.toString();
        return (
          <div className="plugin-setting theme-selector">
            <strong>Theme</strong>{' '}
            <a className={currentTheme === 'default' ? 'active' : ''} href={`?${baseQuery}`}>Default</a>{' '}
            <a className={currentTheme === 'mauve' ? 'active' : ''} href={`?${baseQuery}&theme=mauve`}>Mauve</a>{' '}
            <a className={currentTheme === 'night-mode' ? 'active' : ''} href={`?${baseQuery}&theme=night-mode`}>Night Mode</a>
          </div>
        );
      }
    }
  }
};
