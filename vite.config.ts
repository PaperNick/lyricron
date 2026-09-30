import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

/** Short commit hash of the revision being built ('' when unavailable). */
function getRevision() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __REVISION__: JSON.stringify(getRevision()),
  },
});
