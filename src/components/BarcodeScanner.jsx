import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export default function BarcodeScanner({ active, onResult }) {
  const videoRef = useRef(null);
  const [reader] = useState(() => {
    const hints = new Map();
    // Prioritize common 1D formats and QR if needed.
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.ITF,
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
      BarcodeFormat.QR_CODE,
    ]);
    return new BrowserMultiFormatReader(hints, 300);
  });
  const [deviceId, setDeviceId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const cams = await BrowserMultiFormatReader.listVideoInputDevices();
        setDevices(cams);
        const preferred = cams.find(d => /back|rear|environment/i.test(d.label))?.deviceId || cams[0]?.deviceId;
        setDeviceId(preferred ?? null);
      } catch {
        setError('No camera devices found or permission denied.');
      }
    })();
  }, []);

  useEffect(() => {
    if (!active || !deviceId || !videoRef.current) return;
    let cleanup = () => {};
    reader.decodeFromVideoDevice(
      deviceId,
      videoRef.current,
      (result, err, controls) => {
        cleanup = () => controls?.stop();
        if (result) onResult?.(result.getText());
      }
    );
    return () => cleanup();
  }, [active, deviceId, reader, onResult]);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {active && (
        <>
          <video ref={videoRef} style={{ width: '100%', maxWidth: 480, borderRadius: 8 }} muted autoPlay playsInline />
          {devices.length > 1 && (
            <select value={deviceId || ''} onChange={e => setDeviceId(e.target.value)}>
              {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>)}
            </select>
          )}
        </>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}