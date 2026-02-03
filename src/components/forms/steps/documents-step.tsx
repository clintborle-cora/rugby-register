'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HeadshotUpload, DocumentUpload } from '@/components/ui/file-upload'
import type { PlayerFormData } from '@/lib/validations'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

type PlayerWithMeta = PlayerFormData & {
  id: string
  division: string
  headshot?: { file: File; preview: string }
  dobDocument?: { file: File; name: string }
}

interface DocumentsStepProps {
  players: PlayerWithMeta[]
  onUpdate: (players: PlayerWithMeta[]) => void
  onNext: () => void
  onBack: () => void
}

export function DocumentsStep({ players, onUpdate, onNext, onBack }: DocumentsStepProps) {
  const handleHeadshotSelect = (playerId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const updated = players.map(p =>
        p.id === playerId
          ? { ...p, headshot: { file, preview: reader.result as string } }
          : p
      )
      onUpdate(updated)
    }
    reader.readAsDataURL(file)
  }
  
  const handleHeadshotRemove = (playerId: string) => {
    const updated = players.map(p =>
      p.id === playerId ? { ...p, headshot: undefined } : p
    )
    onUpdate(updated)
  }
  
  const handleDocumentSelect = (playerId: string, file: File) => {
    const updated = players.map(p =>
      p.id === playerId
        ? { ...p, dobDocument: { file, name: file.name } }
        : p
    )
    onUpdate(updated)
  }
  
  const handleDocumentRemove = (playerId: string) => {
    const updated = players.map(p =>
      p.id === playerId ? { ...p, dobDocument: undefined } : p
    )
    onUpdate(updated)
  }
  
  const allDocumentsUploaded = players.every(p => p.headshot && p.dobDocument)
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload a headshot photo and proof of date of birth for each player.
        </p>
      </div>
      
      <div className="space-y-6">
        {players.map(player => {
          const isComplete = player.headshot && player.dobDocument
          
          return (
            <Card key={player.id} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  {player.first_name} {player.last_name}
                </h3>
                {isComplete && (
                  <span className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <HeadshotUpload
                  label="Headshot Photo"
                  onFileSelect={(file) => handleHeadshotSelect(player.id, file)}
                  onFileRemove={() => handleHeadshotRemove(player.id)}
                  currentFile={
                    player.headshot
                      ? { name: 'headshot.jpg', preview: player.headshot.preview }
                      : undefined
                  }
                />
                
                <DocumentUpload
                  label="Date of Birth Proof"
                  onFileSelect={(file) => handleDocumentSelect(player.id, file)}
                  onFileRemove={() => handleDocumentRemove(player.id)}
                  currentFile={
                    player.dobDocument
                      ? { name: player.dobDocument.name }
                      : undefined
                  }
                />
              </div>
            </Card>
          )
        })}
      </div>
      
      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Photo Requirements</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Headshot:</strong> Clear, recent photo with face visible (no sunglasses, helmets, or masks)</li>
          <li>• <strong>DOB Proof:</strong> Birth certificate, passport, or Real ID showing date of birth</li>
          <li>• Files must be JPG, PNG, or PDF under 5MB</li>
        </ul>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!allDocumentsUploaded}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
