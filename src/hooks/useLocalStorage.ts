import { useState } from 'react';

/**
 * localStorageと同期するstate。読み込み時にJSONパースやデータ破損に失敗した場合は
 * 常にinitialValueへ安全にフォールバックする。sanitizeを渡すと、パース後の値を
 * 検証・補完してから利用できる（後方互換性のあるデータ移行に使う）。
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  sanitize?: (raw: unknown) => T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === null) return initialValue;
      const parsed: unknown = JSON.parse(stored);
      return sanitize ? sanitize(parsed) : (parsed as T);
    } catch {
      return initialValue;
    }
  });

  const setAndStore = (next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved =
        typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // localStorageが使用できない環境でも画面上の状態は継続させる
      }
      return resolved;
    });
  };

  return [value, setAndStore];
}
