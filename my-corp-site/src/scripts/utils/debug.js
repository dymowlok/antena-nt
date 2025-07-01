// Utility for controlling debug logs
export function enableDebug() {
  window.DEBUG_MODE = true;
}

export function disableDebug() {
  window.DEBUG_MODE = false;
}

window.DEBUG_MODE = import.meta.env.DEV ? true : false;

export function debugLog(...args) {
  if (window.DEBUG_MODE) {
    console.log(...args);
  }
}

export function debugWarn(...args) {
  if (window.DEBUG_MODE) {
    console.warn(...args);
  }
}

export function debugError(...args) {
  if (window.DEBUG_MODE) {
    console.error(...args);
  }
}
