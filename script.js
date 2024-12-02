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

    function switchTo(key) {
      const oldDoc = JSON.parse(localStorage.getItem(key));
      if (oldDoc) {
        doc.uuid = oldDoc.uuid;
        doc.text = oldDoc.text;
        doc.startTime = oldDoc.startTime;
        doc.endTime = oldDoc.endTime;
      }
    }

    return {
      new() {
        doc.uuid = newUUID();
        doc.text = '';
      },
      switchTo,
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

  const historyOverlayEl = document.querySelector('div#history-overlay');
  historyOverlayEl
    .addEventListener('click', function historyOverlayClickListener(event) {
      const target = event.target.closest('div.history-item');
      console.log(target);
      if (target.dataset.key) {
        docStorage.switchTo(target.dataset.key);
        totalString = docStorage.getItem('text');
        cursorEl.value = totalString;
        startTime = docStorage.getItem('startTime');
        endTime = docStorage.getItem('endTime');
        commit(event);
      }
      historyOverlayEl.style.display = 'none';
    });

  function populateHistory() {
    // list all items in the localStorage, one per line, into historyOverlayEl
    historyOverlayEl.innerHTML = '';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const doc = JSON.parse(localStorage.getItem(key));
      if (doc) {
        const historyItemEl = document.createElement('div');
        historyItemEl.className = 'history-item';
        historyItemEl.dataset.key = key;
        historyItemEl.innerHTML = [
          `<span class="zettel-id">${zettelIDPretty(timeStringToZettelID(doc.startTime))}</span>`,
          '<span> </span>',
          `<span>${doc.text.slice(0, 20)}...</span>`,
        ].join('');
        historyOverlayEl.appendChild(historyItemEl);
      }
    }
  }

  const historyButtonEl = document.querySelector('button#history');
  historyButtonEl
    .addEventListener('click', function clearButtonClickListener(event) {
      populateHistory();
      historyOverlayEl.style.display = 'block';
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
