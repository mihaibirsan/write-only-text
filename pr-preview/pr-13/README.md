
# Write Only Text

Distraction free: write only text. Backspace, copy and clear allowed. Will tell start, end and word count for session.

Originally developed at [Write Only Text (codepen.io)](https://codepen.io/mihaibirsan/full/rNWdoJj)

## Praise

Sent by Joshua Stavick https://medium.com/@joshuastavick

> You're writing app is incredible. Yesterday I couldn't write more than 400 words in the four hours I was here. 
> 
> Today, I've written over 2000, and I still have another writing session planned. 
> 
> Thank you!

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

## Development

Use live reload during development.

NOTE: Useful when developing for mobile!

```sh
npx run dev
```

And perhaps try [Remote debug Android devices - Chrome for Developers](https://developer.chrome.com/docs/devtools/remote-debugging/)!
