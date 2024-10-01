(function () {
  const params = new URLSearchParams(location.search);
  document.documentElement.className = params.get('theme');
  const textEl = document.getElementById('text');
  const timeEl = document.getElementById('time');
  const wordCountEl = document.getElementById('wordcount');
  const cursorEl = document.getElementById('cursor');
  
  function smoosh(stringData) {
    return stringData.filter(v => (typeof v === 'string')).join('');
  }
  
  function add(stringData, value) {
    // if the last element is a string, append to it
    if (typeof stringData[stringData.length - 1] === 'string') {
      stringData[stringData.length - 1] += value;
    } else {
      stringData.push(value);
    }
  }
  
  function del(stringData, length) {
    if (length === 0) {
      return;
    }
    // prepare a del item
    let delItem = { type: 'del', value: '' };
    let i = stringData.length - 1;
    while (i >= 0 && length > 0) {
      if (stringData[i].type === 'del') {
        delItem.value = stringData[i].value + delItem.value;
        stringData.pop();
        i--;
      } else {
        const lastString = stringData[i];
        if (lastString.length <= length) {
          length -= lastString.length;
          delItem.value = lastString + delItem.value;
          stringData.pop();
          i--;
        } else {
          stringData[i] = lastString.slice(0, lastString.length - length);
          delItem.value = lastString.slice(lastString.length - length) + delItem.value;
          length = 0;
        }
      }
    }
    stringData.push(delItem);
  }

  // Binary search for the lowest common string.
  function lowestCommonString(left, right) {
    let high = Math.min(left.length, right.length);
    if (left.slice(0, high) === right.slice(0, high)) {
      return left.slice(0, high);
    }
    let low = 0;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (left.slice(0, mid) === right.slice(0, mid)) {
        if (low === mid) break;
        low = mid;
      } else {
        high = mid;
      }
    }
    return left.slice(0, low);
  }
  
  function presentHTML(stringData) {
    return stringData.map(v => (typeof v === 'string') ? v : `<` + v.type + `>` + v.value + `</` + v.type + `>`).join('');
  }
  
  let totalString = window.localStorage.getItem('text') || '';
  window.localStorage.removeItem('text');
  // Allow backward compatibility with the old string storage.
  const stringData = totalString ? [ totalString ] : JSON.parse(window.localStorage.getItem('stringData') || '[]');
  textEl.innerText = presentHTML(stringData);
  cursorEl.value = smoosh(stringData);
  
  let startTime = window.localStorage.getItem('startTime') || null;
  let endTime = window.localStorage.getItem('endTime') || null;
  
  const currentTimeString = () => luxon.DateTime.now().set({ seconds: 0, milliseconds: 0 }).toISO({ suppressSeconds: true })
  const wordCount = () => (smoosh(stringData).match(/\w+/g) || []).length
  
  function commit(event) {
    textEl.innerHTML = presentHTML(stringData);
    window.localStorage.setItem('stringData', JSON.stringify(stringData));
    event?.preventDefault();
    cursorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    timeEl.innerText = `${startTime} - ${endTime}`;
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
    const previousString = smoosh(stringData);
    const nextString = cursorEl.value;
    const commonString = lowestCommonString(previousString, nextString);
    if (commonString === nextString) {
      del(stringData, previousString.length - nextString.length);
    } else if (commonString === previousString) {
      add(stringData, nextString.slice(previousString.length));
    } else {
      del(stringData, previousString.length - commonString.length);
      add(stringData, nextString.slice(commonString.length));
    }
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
      const stats = `\n\nStarted at:: ${startTime}\nFinished at:: ${endTime}\nCopied at:: ${copyTime}\nWord count:: ${wordCount()}`;
      const textPart = smoosh(stringData) + stats;
      const htmlPart = (presentHTML(stringData) + stats).replaceAll('\n', '<br>');
      copy(textPart, htmlPart);
      copyButtonEl.blur();
    });
  
  const clearButtonEl =   document.querySelector('button#clear');
  clearButtonEl
    .addEventListener('click', function clearButtonClickListener(event) {
      stringData.splice(0, stringData.length, '');
      cursorEl.value = '';
      startTime = null;
      window.localStorage.removeItem('startTime');
      endTime = null;
      window.localStorage.removeItem('endTime');
      commit(event);
      clearButtonEl.blur();
    });
})();

function copy(textPart, htmlPart) {
  const clipboardItem = new ClipboardItem({
    'text/plain': new Blob([textPart], { type: 'text/plain' }),
    'text/html': new Blob([htmlPart], { type: 'text/html' })
  });

  navigator.clipboard.write([clipboardItem]).then(() => {
    console.log('Text and HTML copied to clipboard');
  }).catch((err) => {
    console.error('Error copying to clipboard', err);
  });
}
