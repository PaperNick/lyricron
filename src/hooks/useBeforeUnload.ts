import { useEffect } from 'react';

/** Warns before closing/refreshing the tab while `enabled` is true. */
export function useBeforeUnload(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [enabled]);
}
