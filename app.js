const { useState, useEffect, useRef } = React;

// Utility functions from original script
const currentTimeString = () => luxon.DateTime.now().set({ milliseconds: 0 }).toISO({ suppressMilliseconds: true });
const timeStringToZettelID = (timeString) => timeString && timeString.replaceAll(/[- :T]+/g, '');
const zettelIDPretty = (zettelID) => zettelID.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(.+)/, '<span>$1</span><span>$2</span><span>$3</span><span>$4$5</span><span>$6</span>');
const wordCount = (text) => (text.match(/\p{L}+/gu) || []).length;

// Utility functions for sharing and copying
function shareAsFile(filename, text) {
  navigator.share({
    files: [new File([text], `${filename}.txt`, { type: 'text/plain' })],
  });
}

function share(text) {
  const [title] = text.split('\n');
  navigator.share({
    title,
    text,
  });
}

function copy(text) {
  const fake = document.body.appendChild(document.createElement("textarea"));
  fake.style.position = "absolute";
  fake.style.left = "-9999px";
  fake.setAttribute("readonly", "");
  fake.value = "" + text;
  fake.select();
  try {
    return document.execCommand("copy");
  } catch (err) {
    return false;
  } finally {
    fake.parentNode.removeChild(fake);
  }
}

// Custom hook for localStorage
// TODO: UNUSED
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage:`, error);
    }
  };

  return [storedValue, setValue, removeValue];
}

// TextRenderer Component - displays the text
function TextRenderer({ doc }) {
  return (
    <div id="text">{doc.totalString}</div>
  );
}

// TextInput Component - hidden input for capturing keystrokes
function TextInput({ doc, onDocChange }) {
  const textareaRef = useRef(null);

  const handleInput = (event) => {
    const newDoc = {
      ...doc,
      totalString: event.target.value
    };

    // Set start time if this is the first input
    if (doc.startTime === null) {
      newDoc.startTime = currentTimeString();
    }
    
    // Always update end time
    newDoc.endTime = currentTimeString();
    
    // TODO: Is there a better way to model this as reactive?
    onDocChange(newDoc);
  };

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length, 
        textareaRef.current.value.length
      );
    }
  };

  // NOTE: This would be a lot easier of <textarea> supported selectionchange natively.
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.addEventListener('selectionchange', handleSelectionChange);
      return () => {
        if (textareaRef.current) {
          textareaRef.current.removeEventListener('selectionchange', handleSelectionChange);
        }
      };
    }
  }, []);

  return (
    <textarea 
      ref={textareaRef}
      id="cursor" 
      name="cursor"
      value={doc.totalString}
      onChange={handleInput}
    />
  );
}

// WordCount Component
function WordCount({ doc }) {
  return (
    <span id="wordcount">• {wordCount(doc.totalString)} words</span>
  );
}

// TimeDisplay Component
function TimeDisplay({ doc }) {
  if (doc.startTime === null) {
    return <span id="time">{' '}<span>Just start typing.</span>{' '}</span>;
  }

  return (
    <span 
      id="time"
      // TODO: Verbose composition should be updated
      dangerouslySetInnerHTML={{
        __html: [
          ' ',
          zettelIDPretty(timeStringToZettelID(doc.startTime)),
          '<span>-></span>',
          zettelIDPretty(timeStringToZettelID(doc.endTime)),
          ' ',
        ].join('')
      }}
    />
  );
}

// ActionButtons Component
function ActionButtons({ doc, onClear }) {
  const textToCopy = () => {
    const copyTime = currentTimeString();
    return `${doc.totalString}\n\nStarted at:: ${doc.startTime}\nFinished at:: ${doc.endTime}\nCopied at:: ${copyTime}\nWord count:: ${wordCount(doc.totalString)}`;
  };

  const handleCopy = (event) => {
    event.preventDefault();
    copy(textToCopy());
    event.target.blur();
  };

  const handleClear = (event) => {
    event.preventDefault();
    if (!window.confirm('Are you sure you want to clear the text?')) {
      return;
    }
    onClear();
    event.target.blur();
  };

  const handleShareAsFile = (event) => {
    event.preventDefault();
    const filename = timeStringToZettelID(doc.startTime).replace(/\+.+$/, '');
    shareAsFile(filename, textToCopy());
    event.target.blur();
  };

  const handleShare = (event) => {
    event.preventDefault();
    share(textToCopy());
    event.target.blur();
  };

  return (
    <>
      <button id="share-as-file" onClick={handleShareAsFile}>Share as file</button>
      {' '}
      <button id="share" onClick={handleShare}>Share</button>
      {' '}
      <button id="copy" onClick={handleCopy}>Copy</button>
      {' '}
      <button id="clear" onClick={handleClear}>Clear</button>
    </>
  );
}

// OfflineReady Component
function OfflineReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => {
          setIsReady(true);
        })
    }
  }, []);

  return (
    <span id="offline-status" className={isReady ? 'ready' : 'not-ready'}>
      {isReady ? 'Offline Ready' : 'Offline Not Ready'}
    </span>
  );
}

// VersionStatus Component
function VersionStatus() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    fetch('package.json')
      .then(response => response.json())
      .then(data => {
        setVersion(data.version);
      })
      .catch(err => {
        console.error('Failed to fetch version:', err);
      });
  }, []);

  if (version === '') {
    return <></>;
  } else {
    return <span id="version-status">v{version}</span>;
  }
}

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
