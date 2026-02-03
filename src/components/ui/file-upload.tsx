'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { Upload, X, FileImage, FileText, Check } from 'lucide-react'
import Image from 'next/image'

interface FileUploadProps {
  label: string
  description?: string
  accept?: Record<string, string[]>
  maxSize?: number // in bytes
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  error?: string
  currentFile?: { name: string; url?: string; preview?: string }
  showPreview?: boolean
  className?: string
}

export function FileUpload({
  label,
  description,
  accept = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFileSelect,
  onFileRemove,
  error,
  currentFile,
  showPreview = true,
  className,
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentFile?.preview || null)
  
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        // Create preview for images
        if (file.type.startsWith('image/') && showPreview) {
          const reader = new FileReader()
          reader.onload = () => {
            setPreview(reader.result as string)
          }
          reader.readAsDataURL(file)
        }
        onFileSelect(file)
      }
    },
    [onFileSelect, showPreview]
  )
  
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  })
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    onFileRemove?.()
  }
  
  const hasFile = currentFile || preview
  const isImage = currentFile?.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i) || preview
  
  // Get rejection error message
  const rejectionError = fileRejections[0]?.errors[0]?.message
  const displayError = error || rejectionError
  
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : displayError
            ? 'border-red-300 bg-red-50'
            : hasFile
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        )}
      >
        <input {...getInputProps()} />
        
        {hasFile ? (
          <div className="flex items-center gap-4">
            {/* Preview */}
            {showPreview && isImage && (preview || currentFile?.url) ? (
              <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={preview || currentFile?.url || ''}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            )}
            
            {/* File info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {currentFile?.name || 'File uploaded'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Click or drag to replace
              </p>
            </div>
            
            {/* Remove button */}
            {onFileRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Remove file"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              {isImage ? (
                <FileImage className="h-6 w-6 text-gray-400" />
              ) : (
                <Upload className="h-6 w-6 text-gray-400" />
              )}
            </div>
            
            <div className="text-sm">
              <span className="font-medium text-primary-600">
                Click to upload
              </span>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        )}
      </div>
      
      {displayError && (
        <p className="mt-1 text-sm text-red-600">{displayError}</p>
      )}
    </div>
  )
}

// Specialized headshot upload with face detection guidance
export function HeadshotUpload(props: Omit<FileUploadProps, 'accept' | 'description'>) {
  return (
    <FileUpload
      {...props}
      accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
      description="Clear headshot, no obstructions (helmets, sunglasses). Max 5MB."
    />
  )
}

// Document upload (birth certificate, passport, etc.)
export function DocumentUpload(props: Omit<FileUploadProps, 'accept' | 'description'>) {
  return (
    <FileUpload
      {...props}
      accept={{
        'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
        'application/pdf': ['.pdf'],
      }}
      description="Birth certificate, passport, or Real ID. JPG, PNG, or PDF. Max 5MB."
      showPreview={false}
    />
  )
}
