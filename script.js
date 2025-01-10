(function () {
  const params = new URLSearchParams(location.search);
  document.documentElement.className = params.get('theme');
  const textEl = document.getElementById('text');
  const timeEl = document.getElementById('time');
  const wordCountEl = document.getElementById('wordcount');
  const cursorEl = document.getElementById('cursor');
  const versionStatusEl = document.getElementById('version-status');
  
  let totalString = window.localStorage.getItem('text') || '';
  textEl.innerText = totalString;
  cursorEl.value = totalString;
  
  let startTime = window.localStorage.getItem('startTime') || null;
  let endTime = window.localStorage.getItem('endTime') || null;
  
  const currentTimeString = () => luxon.DateTime.now().set({ milliseconds: 0 }).toISO({ suppressMilliseconds: true });
  const timeStringToZettelID = (timeString) => timeString.replaceAll(/[- :T]+/g, '');
  const zettelIDPretty = (zettelID) => zettelID.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(.+)/, '<span>$1</span><span>$2</span><span>$3</span><span>$4$5</span><span>$6</span>');
  const wordCount = () => (totalString.match(/\p{L}+/gu) || []).length
  
  function commit(event) {
    textEl.innerText = totalString;
    window.localStorage.setItem('text', totalString);
    event?.preventDefault();
    cursorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    if (startTime === null) {
      timeEl.innerHTML = '<span>Just start typing.</span>';
    } else {
      timeEl.innerHTML = [
        zettelIDPretty(timeStringToZettelID(startTime)),
        '<span>-></span>',
        zettelIDPretty(timeStringToZettelID(endTime)),
      ].join('');
    }
    wordCountEl.innerText = `• ${wordCount()} words`;
  }
  commit()
  
  function keydownListener(event) {
    if (startTime === null) {
      startTime = currentTimeString();
      window.localStorage.setItem('startTime', startTime);
    }
    endTime = currentTimeString();
    window.localStorage.setItem('endTime', endTime);

    // Make sure there's input from keyboard.
    if (document.activeElement !== cursorEl) {
      cursorEl.focus();
    }
  }
  
  document.addEventListener('keydown', keydownListener);

  // Bring up the keyboard on mobile.
  document.addEventListener('click', () => {
    cursorEl.focus();
  });

  // Update the text when the user types.
  cursorEl.addEventListener('input', (event) => {
    totalString = cursorEl.value;
    commit(event);
  });

  // Keep the cursor at the end of the text.
  cursorEl.addEventListener('selectionchange', (event) => {
    cursorEl.setSelectionRange(cursorEl.value.length, cursorEl.value.length);
  });

  const textToCopy = () => {
    const copyTime = currentTimeString();
    return `${totalString}\n\nStarted at:: ${startTime}\nFinished at:: ${endTime}\nCopied at:: ${copyTime}\nWord count:: ${wordCount()}`;
  }

  const shareAsFileButtonEl = document.querySelector('button#share-as-file');
  shareAsFileButtonEl
    .addEventListener('click', function clearButtonClickListener(event) {
      const filename = timeStringToZettelID(startTime).replace(/\+.+$/, '');
      shareAsFile(filename, textToCopy());
      shareAsFileButtonEl.blur();
    });

  const shareButtonEl = document.querySelector('button#share');
  shareButtonEl
    .addEventListener('click', function clearButtonClickListener(event) {
      share(textToCopy());
      shareButtonEl.blur();
    });

  const copyButtonEl = document.querySelector('button#copy');
  copyButtonEl
    .addEventListener('click', function clearButtonClickListener(event) {
      copy(textToCopy());
      copyButtonEl.blur();
    });
  
  const clearButtonEl =   document.querySelector('button#clear');
  clearButtonEl
    .addEventListener('click', function clearButtonClickListener(event) {
      if (!window.confirm('Are you sure you want to clear the text?')) {
        return;
      }

      totalString = '';
      cursorEl.value = totalString;
      startTime = null;
      window.localStorage.removeItem('startTime');
      endTime = null;
      window.localStorage.removeItem('endTime');
      commit(event);
      clearButtonEl.blur();
    });

  // Display version number
  fetch('package.json')
    .then(response => response.json())
    .then(data => {
      versionStatusEl.innerText = ` v${data.version}`;
    })
    .catch(err => {
      console.error('Failed to fetch version:', err);
    });
})();

function shareAsFile(filename, text) {
  navigator.share({
    files: [new File([text], `${filename}.txt`, { type: 'text/plain' })],
  });
}

function share(text) {
  // title is first line
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
