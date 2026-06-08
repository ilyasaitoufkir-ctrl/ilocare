import React, { useRef } from 'react'

interface PhotoPickerProps {
  photo: string | null
  onPhoto: (dataUrl: string) => void
  size?: number
  emoji?: string
}

export function PhotoPicker({ photo, onPhoto, size = 100, emoji = '👤' }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      if (ev.target?.result) onPhoto(ev.target.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: '#f8e8e8',
        border: '3px solid #e8a0a0',
        cursor: 'pointer',
      }}
    >
      {photo ? (
        <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: size * 0.45 }}>{emoji}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  )
}
