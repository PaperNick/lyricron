import { useEffect, useRef } from 'react';

/** Keeps a ref pointing at the latest value, for use inside stable event listeners. */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
