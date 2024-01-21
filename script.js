(function () {
  const params = new URLSearchParams(location.search);
  document.documentElement.className = params.get('theme');
  const textEl = document.getElementById('text');
  const timeEl = document.getElementById('time');
  const wordCountEl = document.getElementById('wordcount');
  const clearingEl = document.getElementById('clearing');
  
  let totalString = window.localStorage.getItem('text') || '';
  textEl.innerText = totalString;
  
  let startTime = window.localStorage.getItem('startTime') || null;
  let endTime = window.localStorage.getItem('endTime') || null;
  
  const currentTimeString = () => luxon.DateTime.now().set({ seconds: 0, milliseconds: 0 }).toISO({ suppressSeconds: true })
  const wordCount = () => (totalString.match(/\w+/g) || []).length
  
  function commit(event) {
    textEl.innerText = totalString;
    window.localStorage.setItem('text', totalString);
    event?.preventDefault();
    clearingEl.scrollIntoView({ behavior: 'smooth' });
    
    timeEl.innerText = `${startTime} - ${endTime}`;
    wordCountEl.innerText = `• ${wordCount()} words`;
  }
  commit()
  
  function keypressListener(event) {
    let processed = false;
    if (event.key === 'Enter') {
      totalString = totalString + '\n';
      processed = true;
    } else if (event.key) {
      totalString = totalString + event.key;
      processed = true;
    }
    processed && commit(event);
  }
  
  function keydownListener(event) {
    let processed = false;
    if (event.key === 'Backspace') {
      let deleteLength = 1;
      if (event.ctrlKey) {
        const match = totalString.match(/\b\w+\s*$/);
        if (match) {
          deleteLength = match[0].length;
        }
      }
      totalString = totalString.substr(0, totalString.length - deleteLength);
      processed = true;
    }
    processed && commit(event);
    if (startTime === null) {
      startTime = currentTimeString();
      window.localStorage.setItem('startTime', startTime);
    }
    endTime = currentTimeString();
    window.localStorage.setItem('endTime', endTime);
  }
  
  document.addEventListener('keypress', keypressListener);
  document.addEventListener('keydown', keydownListener);

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
      startTime = null;
      window.localStorage.removeItem('startTime');
      endTime = null;
      window.localStorage.removeItem('endTime');
      commit(event);
      clearButtonEl.blur();
    });
})();

async function copy(text) {
  try {
    await navigator.clipboard.writeText(String(text));
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}
