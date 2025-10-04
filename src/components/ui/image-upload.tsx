'use client'

import { useState, useRef } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  label: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  aspectRatio?: 'square' | 'video' | 'auto'
  maxSizeMB?: number
}

export function ImageUpload({
  label,
  value,
  onChange,
  disabled = false,
  aspectRatio = 'auto',
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear previous errors
    setError('')

    // Validate file type first
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError(`Formato no permitido. Solo se aceptan: JPEG, PNG, WebP, SVG`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
      setError(`Archivo muy grande (${fileSizeMB}MB). Máximo ${maxSizeMB}MB`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir archivo')
      }

      onChange(data.url)
      console.log('✓ Image uploaded:', data.url)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Error al subir archivo. Intenta nuevamente.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      setUrlInput('')
      setShowUrlInput(false)
    }
  }

  const handleRemove = async () => {
    if (value) {
      // Optionally delete from blob storage
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(value)}`, {
          method: 'DELETE',
        })
      } catch (err) {
        console.error('Failed to delete file:', err)
      }
      onChange('')
    }
  }

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  }[aspectRatio]

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Preview */}
      {value && (
        <div className="relative group">
          <div className={`border border-gray-200 rounded-lg overflow-hidden bg-gray-50 ${aspectRatioClass}`}>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E'
              }}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Upload Options */}
      {!value && (
        <div className="space-y-2">
          {/* File Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={disabled || isUploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir imagen
                </>
              )}
            </Button>
          </div>

          {/* URL Input Toggle */}
          {!showUrlInput ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowUrlInput(true)}
              disabled={disabled || isUploading}
            >
              O usar URL de imagen
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={disabled || isUploading}
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleUrlSubmit}
                disabled={disabled || isUploading || !urlInput.trim()}
              >
                OK
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowUrlInput(false)
                  setUrlInput('')
                }}
                disabled={disabled || isUploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Formatos: JPEG, PNG, WebP, SVG. Máximo {maxSizeMB}MB
      </p>
    </div>
  )
}
