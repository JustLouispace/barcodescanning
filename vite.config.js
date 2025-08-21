import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: (() => {
    const keyPath = process.env.VITE_SSL_KEY || 'd:/certs/cloud.sino.co.th.key';
    const certPath = process.env.VITE_SSL_CERT || 'd:/certs/cloud.sino.co.th.crt';
    let httpsOpt = undefined;
    try {
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        httpsOpt = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
      }
    } catch {}
    return {
      host: true,
      port: 1423,
      https: httpsOpt,
    };
  })(),
  preview: (() => {
    const keyPath = process.env.VITE_SSL_KEY || 'd:/certs/cloud.sino.co.th.key';
    const certPath = process.env.VITE_SSL_CERT || 'd:/certs/cloud.sino.co.th.crt';
    let httpsOpt = undefined;
    try {
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        httpsOpt = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
      }
    } catch {}
    return {
      host: true,
      port: 1423,
      strictPort: true,
      https: httpsOpt,
    };
  })(),
})
