export function safeGetLocalStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch (err) {
    console.warn(`localStorage getItem error for key "${key}":`, err);
  }
  return null;
}

export function safeSetLocalStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn(`localStorage setItem error for key "${key}":`, err);
  }
}

export function safeRemoveLocalStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`localStorage removeItem error for key "${key}":`, err);
  }
}
