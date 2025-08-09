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
      endTime: savedEndTime
    };
  });

  // Handle theme from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const theme = params.get('theme');
    if (theme) {
      document.documentElement.className = theme;
    }
  }, []);

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
      endTime: null
    };
    setDoc(newDoc);
    window.localStorage.removeItem('startTime');
    window.localStorage.removeItem('endTime');
  };

  return (
    <div>
      <div id="enclosure">
        <TextRenderer doc={doc} />
        <TextInput doc={doc} onDocChange={handleDocChange} />
      </div>

      <div id="toolbar">
        {/* TODO: Reverted to original layout, even though it was semantically incorrect. */}
        <div id="buttons">
          <ActionButtons doc={doc} onClear={handleClear} />
          <TimeDisplay doc={doc} />
          <WordCount doc={doc} />
        </div>
      </div>
      
      <div id="status">
        <OfflineReady />{' '}
        <VersionStatus />
      </div>
    </div>
  );
}

// Mount the React app
ReactDOM.render(<App />, document.getElementById('app'));
