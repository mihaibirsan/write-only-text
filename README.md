
# Write Only Text

Distraction free: write only text. Backspace, copy and clear allowed. Will tell start, end and word count for session.

Start or continue your session here: https://mihaibirsan.github.io/write-only-text/

Originally developed at [Write Only Text (codepen.io)](https://codepen.io/mihaibirsan/full/rNWdoJj)

## Features
+ Works on desktop and mobile. _(Add as app!)_
+ Typing only appends to the end of the string. 
+ There is no editing, with one exception: backspace is permitted.
+ Text is saved to localStorage, for convenience.

Basic UX
+ Confirmation dialog when clearing text.
+ There's a [mauve theme](https://mihaibirsan.github.io/write-only-text/?theme=mauve) (Want [more](https://github.com/mihaibirsan/write-only-text/issues/1)?)

## TODO
+ Bring in a simple UI library. (Considering https://ui.shadcn.com/)
+ Structure the app with Commands (Ctrl+K or Ctrl+P or something)
+ Display UI notification when errors occur
+ Store multiple files on localStorage.
+ Keep a timer.
+ Track words per minute. Word-by-word and "Clear" undo.
+ Enable storage against a local folder.
+ Enable storage against a remote folder. (e.g. GitHub, Dropbox, etc.)

## Running locally

```sh
npx http-server
```

Ebenen Monaco has issues when typing on I. 
