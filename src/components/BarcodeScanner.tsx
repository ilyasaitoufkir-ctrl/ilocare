import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { X } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    let stopped = false

    reader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      videoRef.current!,
      (result, err) => {
        if (stopped) return
        if (result) {
          stopped = true
          onScan(result.getText())
        }
        if (err && !(err.message?.includes('No MultiFormat'))) {
          // ignore continuous not-found errors
        }
      }
    ).catch(() => {
      setError('Kamera nicht verfügbar. Bitte Kamera-Zugriff erlauben.')
    })

    return () => {
      stopped = true
      BrowserMultiFormatReader.releaseAllStreams()
    }
  }, [onScan])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#000' }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
        <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
          📷 Barcode scannen
        </p>
        <button
          onClick={onClose}
          className="rounded-full flex items-center justify-center"
          style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <X size={28} color="#fff" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="p-8 text-center">
            <p style={{ color: '#fff', fontSize: '1.1rem' }}>{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              playsInline
            />
            {/* Scan-Rahmen */}
            <div
              className="absolute"
              style={{
                width: '250px',
                height: '160px',
                border: '3px solid #4ade80',
                borderRadius: '12px',
                boxShadow: '0 0 0 4000px rgba(0,0,0,0.5)',
              }}
            />
            <p
              className="absolute bottom-12 left-0 right-0 text-center"
              style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}
            >
              Barcode in den grünen Rahmen halten
            </p>
          </>
        )}
      </div>
    </div>
  )
}
