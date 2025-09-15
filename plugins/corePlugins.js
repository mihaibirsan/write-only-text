// Core Plugins Registry
const CORE_PLUGINS = {
  syntaxHighlighting: {
    name: 'Syntax Highlighting',
    description:
      'Adds syntax coloring to text using highlight.js markdown syntax',
    defaultConfig: {
      enabled: false,
    },
    component: SyntaxHighlightingPlugin,
    slots: {
      settings: SyntaxHighlightingSettings,
    },
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
      settings: PomodoroSettings,
    },
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
            <a
              className={currentTheme === 'default' ? 'active' : ''}
              href={`?${baseQuery}`}
            >
              Default
            </a>{' '}
            <a
              className={currentTheme === 'mauve' ? 'active' : ''}
              href={`?${baseQuery}&theme=mauve`}
            >
              Mauve
            </a>{' '}
            <a
              className={currentTheme === 'night-mode' ? 'active' : ''}
              href={`?${baseQuery}&theme=night-mode`}
            >
              Night Mode
            </a>
          </div>
        );
      },
    },
  },
};
