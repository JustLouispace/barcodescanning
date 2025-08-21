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
    // Encourage deeper search for difficult 1D barcodes (helps in landscape)
    hints.set(DecodeHintType.TRY_HARDER, true);
    return new BrowserMultiFormatReader(hints, 300);
  });
  const [deviceId, setDeviceId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');
  const [isLandscape, setIsLandscape] = useState(() => {
    try {
      if (window?.matchMedia) return window.matchMedia('(orientation: landscape)').matches;
      return (window?.innerWidth || 0) > (window?.innerHeight || 0);
    } catch { return false; }
  });

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

  // Track orientation changes to adjust constraints and preview size
  useEffect(() => {
    const onChange = () => {
      try {
        const land = window?.matchMedia ? window.matchMedia('(orientation: landscape)').matches : window.innerWidth > window.innerHeight;
        setIsLandscape(land);
      } catch {}
    };
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
    };
  }, []);

  useEffect(() => {
    if (!active || !videoRef.current) return;
    let stopped = false;
    let stop = () => {};

    const callback = (result, err, controls) => {
      if (controls && typeof controls.stop === 'function') {
        stop = () => controls.stop();
      }
      if (result) {
        onResult?.(result.getText());
      }
      // Note: do not set error on every decode error; ZXing emits frequent decode errors during scanning.
    };

    // Always use constraints so we can set resolution and optionally target a device
    const widthIdeal = isLandscape ? 1920 : 1280;
    const heightIdeal = isLandscape ? 1080 : 720;
    const constraints = {
      video: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } }),
        width: { ideal: widthIdeal },
        height: { ideal: heightIdeal },
        aspectRatio: { ideal: 16 / 9 },
      },
      audio: false,
    };

    reader.decodeFromConstraints(
      constraints,
      videoRef.current,
      callback
    ).catch((e) => {
      // Show a readable error for common cases like permission denied or unsupported constraints
      const msg = typeof e?.message === 'string' ? e.message : String(e || 'Unknown camera error');
      setError(msg.includes('denied') ? 'Camera permission denied. Please allow camera access in Safari settings.' : `Camera error: ${msg}`);
    });

    return () => {
      if (!stopped) {
        try { stop(); } catch {}
        stopped = true;
      }
    };
  }, [active, deviceId, isLandscape, reader, onResult]);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {active && (
        <>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              maxWidth: isLandscape ? 800 : 480,
              borderRadius: 8,
            }}
            muted
            autoPlay
            playsInline
          />
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