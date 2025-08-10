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
