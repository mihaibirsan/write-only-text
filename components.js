const { useState, useEffect, useRef } = React;

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
