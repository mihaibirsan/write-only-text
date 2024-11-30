(function () {
  const params = new URLSearchParams(location.search);
  document.documentElement.className = params.get('theme');
  const textEl = document.getElementById('text');
  const timeEl = document.getElementById('time');
  const wordCountEl = document.getElementById('wordcount');
  const cursorEl = document.getElementById('cursor');

  const LEFT_SIDE_KEYBOARD = `qwerasdfzxcv1234\`~!@#$`;
  const MID_SIDE_KEYBOARD = `tyughjbnm567%^& `;
  const RIGHT_SIDE_KEYBOARD = `iop[]kl;',./890-=*()_+{}|:"<>?\\`;

  const typewriterSounds = new Howl({
    src: ['43560__tams_kp__typewriter22.mp3'],
    sprite: {
      dingAndReturn: [(60+51)*1000, 1000],
      return: [50*1000, 1000],
    }
  })
  const keySounds = Array.from({ length: 3 }, (_, i) => new Howl({ src: [`key${(i%3)+1}.wav`]}));
  const playAndCycleTypewriterSound = (lastKey) => {
    if (lastKey === null || lastKey === '') {
      return;
    }
    lastKey = lastKey.toLowerCase();
    if (LEFT_SIDE_KEYBOARD.includes(lastKey)) {
      keySounds[0].play();
    }
    if (MID_SIDE_KEYBOARD.includes(lastKey)) {
      keySounds[1].play();
    }
    if (RIGHT_SIDE_KEYBOARD.includes(lastKey)) {
      keySounds[2].play();
    }
    if ("\r\n".includes(lastKey)) {
      typewriterSounds.play('dingAndReturn');
    }
  };
  
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
    
    timeEl.innerHTML = [
      zettelIDPretty(timeStringToZettelID(startTime)),
      '<span>-></span>',
      zettelIDPretty(timeStringToZettelID(endTime)),
    ].join('');
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
    const fakeLastKey = totalString.substring(cursorEl.selectionStart - 1, cursorEl.selectionStart);
    playAndCycleTypewriterSound(fakeLastKey);
    setTimeout(() => commit(event), 20);
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
      totalString = '';
      cursorEl.value = totalString;
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
