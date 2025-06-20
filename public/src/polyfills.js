// WebRTC and Node.js polyfills for browser environment
/* eslint-disable no-undef, no-restricted-globals, no-use-before-define, import/no-anonymous-default-export, no-native-reassign */

// Process polyfill - must be available before any other imports
const process = require('process/browser');
window.process = process;
if (typeof global !== 'undefined') {
  global.process = process;
}

// Buffer polyfill (already installed)
const { Buffer } = require('buffer');
window.Buffer = Buffer;
if (typeof global !== 'undefined') {
  global.Buffer = Buffer;
}

// Global polyfill
if (typeof global === 'undefined') {
  // eslint-disable-next-line no-global-assign, no-native-reassign
  global = (typeof globalThis !== 'undefined' && globalThis) || window || self || {};
  window.global = global;
}

// Additional polyfills for simple-peer
window.global = window.global || window;

export default {};
