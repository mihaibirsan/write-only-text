
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

## Sounds

Intended to make this a more cinematic experience, so that I can record a YouTube video with a "performance of writing". When typing especially fast, the sounds aren't appealing at all, most likely having to do with the order in which they are played.

There's more work to be done for this, shelving it.

Sounds used: [typewriter by yottasounds - Freesound](https://freesound.org/people/yottasounds/packs/21359/)

Target experience: [typewriter22.ogg](https://freesound.org/people/tams_kp/sounds/43560/) manual typewriter some end returns

Wishlist:
- [ ] Support spatial keyboard for multiple languages
- [ ] Support carriage return and proper backspace sounds
- [ ] Play carriage return sounds once per wrapping line
- [ ] "Drying ink" animation when rendering characters

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
