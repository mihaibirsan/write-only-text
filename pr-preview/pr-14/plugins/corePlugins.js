// Core Plugins Registry
const CORE_PLUGINS = {
  syntaxHighlighting: {
    name: 'Syntax Highlighting',
    description: 'Adds syntax coloring to text using markdown-like syntax',
    defaultConfig: { 
      enabled: false, 
      style: 'github' // github, minimal, etc.
    },
    
    initialize(eventEmitter, config) {
      // Register text rendering transformer
      eventEmitter.on('render:text', (data) => {
        if (!config.enabled) return data;
        
        return {
          content: this.applySyntaxHighlighting(data.content, config),
          isHTML: true
        };
      });
    },
    
    cleanup(eventEmitter) {
      // Remove all listeners for this plugin
      eventEmitter.off('render:text', this.renderHandler);
    },
    
    applySyntaxHighlighting(text, config) {
      // Simple markdown-like syntax highlighting
      let highlighted = text
        // Headers
        .replace(/^(#{1,6})\s+(.+)$/gm, '<span class="syntax-header">$1 $2</span>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<span class="syntax-bold">**$1**</span>')
        // Italic
        .replace(/\*(.*?)\*/g, '<span class="syntax-italic">*$1*</span>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<span class="syntax-code-block">```$1```</span>')
        // Inline code
        .replace(/`([^`]+)`/g, '<span class="syntax-code">`$1`</span>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="syntax-link">[$1]($2)</span>')
        // Lists
        .replace(/^(\s*[-*+])\s+(.+)$/gm, '<span class="syntax-list">$1 $2</span>');
      
      return highlighted;
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
              Adds visual styling to markdown-like syntax in your text
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
      showWarning: true
    },
    
    initialize(eventEmitter, config) {
      this.config = config;
      this.startTime = null;
      this.intervalId = null;
      
      // Start timer on first input
      eventEmitter.on('input:start', () => {
        if (!this.startTime) {
          this.startTime = Date.now();
          this.startInterval();
        }
      });
      
      // Validate input based on timer
      eventEmitter.on('validate:input', (data) => {
        if (!config.enabled) return data;
        
        const timeElapsed = this.startTime ? Date.now() - this.startTime : 0;
        const timeRemaining = Math.max(0, config.duration - timeElapsed);
        
        if (timeRemaining === 0) {
          return { ...data, allowed: false, reason: 'Pomodoro session complete' };
        }
        
        return data;
      });
    },
    
    cleanup(eventEmitter) {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.startTime = null;
      eventEmitter.off('input:start', this.inputStartHandler);
      eventEmitter.off('validate:input', this.validateHandler);
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
  }
};
