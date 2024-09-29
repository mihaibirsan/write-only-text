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
    // When text has been deleted, the last element becomes a del item.
    if (previousString.length > nextString.length) {
      del(stringData, previousString.length - nextString.length);
    } else if (previousString.length < nextString.length) {
      add(stringData, nextString.slice(previousString.length));
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
      copy(`${smoosh(stringData)}\n\nStarted at:: ${startTime}\nFinished at:: ${endTime}\nCopied at:: ${copyTime}\nWord count:: ${wordCount()}`);
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
