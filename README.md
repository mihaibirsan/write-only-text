
# Write Only Text

Distraction free: write only text. Backspace, copy and clear allowed. Will tell start, end and word count for session.

Originally developed at [Write Only Text (codepen.io)](https://codepen.io/mihaibirsan/full/rNWdoJj)

## Features
+ Typing only appends to the end of the string. 
+ There is no editing, with one exception: backspace is permitted.
+ Text is saved to localStorage, for convenience.

## TODO
+ Add friction when the "Clear" button is clicked.
+ Keep a timer.

## Running locally

```sh
npx http-server
```

## Development

Use live reload during development.

NOTE: Useful when developing for mobile!

```sh
npx browser-sync start --server --files "*.*"
```

And perhaps try [Remote debug Android devices - Chrome for Developers](https://developer.chrome.com/docs/devtools/remote-debugging/)!
