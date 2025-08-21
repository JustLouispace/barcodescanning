import { useState } from 'react';
import BarcodeScanner from './components/BarcodeScanner';

function App() {
  const [code, setCode] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  return (
    <div style={{ padding: 16 }}>
      <h1>Barcode Scanner</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => {
            setCode('');
            setScannerActive((v) => !v);
          }}
        >
          {scannerActive ? 'Close Camera' : 'Open Camera'}
        </button>
      </div>
      <BarcodeScanner
        active={scannerActive}
        onResult={(text) => {
          setCode(text?.trim?.() || String(text));
          setScannerActive(false); // auto-close after first successful scan
        }}
      />
      <div style={{ marginTop: 12 }}>
        <strong>Scanned code:</strong> {code || '—'}
      </div>
    </div>
  );
}

export default App;