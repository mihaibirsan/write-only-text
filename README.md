
# Write Only Text

Distraction free: write only text. Backspace, copy and clear allowed. Will tell start, end and word count for session.

Originally developed at [Write Only Text (codepen.io)](https://codepen.io/mihaibirsan/full/rNWdoJj)

## Features
+ Typing only appends to the end of the string. 
+ There is no editing, with one exception: backspace is permitted.
+ Text is saved to localStorage, for convenience.

Basic UX
+ Confirmation dialog when clearing text.

## TODO
+ Keep a timer.

## Running locally

```sh
npx http-server
```

## Multiple documents and history

Working with multiple documents should probably be discouraged, and keeping history just opens up the possibility to procrastinate. Still, it's convenient in some cases, and I'd like to experiment with it.

Feature components
- [ ] Every new tab gets a UUID and it's added to the history.
- [ ] Display the list of history docs when a new tab is open.
- [ ] History older than 30 days is deleted.

## Development

Use live reload during development.

NOTE: Useful when developing for mobile!

NOTE: Avoid this when testing with multiple tabs. (Use the plain `npx http-server`.)

```sh
npx run dev
```

And perhaps try [Remote debug Android devices - Chrome for Developers](https://developer.chrome.com/docs/devtools/remote-debugging/)!
