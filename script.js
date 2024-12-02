(function () {
  const docStorage = (function () {
    const newUUID = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    // write a doc to localStorage
    const write = (doc) => {
      if (!doc.text) {
        localStorage.removeItem(doc.uuid);
      } else {
        localStorage.setItem(doc.uuid, JSON.stringify(doc));
      }
    };
    // read the latest doc from localStorage or create a new one
    const read = () => {
      try {
        if (localStorage.length > 0) {
          if (localStorage.getItem('text') || localStorage.getItem('startTime') || localStorage.getItem('endTime')) {
            const oldDoc = {
              uuid: newUUID(),
              text: localStorage.getItem('text'),
              startTime: localStorage.getItem('startTime'),
              endTime: localStorage.getItem('endTime'),
            };
            localStorage.removeItem('text');
            localStorage.removeItem('startTime');
            localStorage.removeItem('endTime');
            write(oldDoc);
            return oldDoc;
          }
          const doc = JSON.parse(localStorage.getItem(localStorage.key(localStorage.length - 1)));
          if (doc) {
            if (!doc.uuid) {
              doc.uuid = newUUID();
            }
            return doc;
          }
        }
      } catch (error) {
        console.error('Error reading from localStorage', error);
      }
      return { uuid: newUUID() };
    };

    const doc = read();

    return {
      new() {
        doc.uuid = newUUID();
        doc.text = '';
      },
      getItem(key) {
        return doc[key];
      },
      setItem(key, value) {
        doc[key] = value;
        write(doc);
      },
    }
  })();

  const params = new URLSearchParams(location.search);
  document.documentElement.className = params.get('theme');
  const textEl = document.getElementById('text');
  const timeEl = document.getElementById('time');
  const wordCountEl = document.getElementById('wordcount');
  const cursorEl = document.getElementById('cursor');

  let totalString = docStorage.getItem('text') || '';
  textEl.innerText = totalString;
  cursorEl.value = totalString;
  
  let startTime = docStorage.getItem('startTime') || null;
  let endTime = docStorage.getItem('endTime') || null;
  
  const currentTimeString = () => luxon.DateTime.now().set({ milliseconds: 0 }).toISO({ suppressMilliseconds: true });
  const timeStringToZettelID = (timeString) => timeString.replaceAll(/[- :T]+/g, '');
  const zettelIDPretty = (zettelID) => zettelID.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(.+)/, '<span>$1</span><span>$2</span><span>$3</span><span>$4$5</span><span>$6</span>');
  const wordCount = () => (totalString.match(/\p{L}+/gu) || []).length
  
  function commit(event) {
    textEl.innerText = totalString;
    docStorage.setItem('text', totalString);
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
      docStorage.setItem('startTime', startTime);
    }
    endTime = currentTimeString();
    docStorage.setItem('endTime', endTime);

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

  const copyButtonEl = document.querySelector('button#copy');
  copyButtonEl
    .addEventListener('click', function clearButtonClickListener(event) {
      const copyTime = currentTimeString();
      copy(`${totalString}\n\nStarted at:: ${startTime}\nFinished at:: ${endTime}\nCopied at:: ${copyTime}\nWord count:: ${wordCount()}`);
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
      endTime = null;
      docStorage.new();
      commit(event);
      clearButtonEl.blur();
    });
})();

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
