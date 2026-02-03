'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import type { PlayerFormData } from '@/lib/validations'
import { ArrowLeft, ArrowRight } from 'lucide-react'

type PlayerWithMeta = PlayerFormData & {
  id: string
  division: string
  headshot?: { file: File; preview: string }
  dobDocument?: { file: File; name: string }
}

interface MedicalStepProps {
  players: PlayerWithMeta[]
  onUpdate: (players: PlayerWithMeta[]) => void
  onNext: () => void
  onBack: () => void
}

export function MedicalStep({ players, onUpdate, onNext, onBack }: MedicalStepProps) {
  const handleChange = (playerId: string, field: string, value: string) => {
    const updated = players.map(p =>
      p.id === playerId ? { ...p, [field]: value } : p
    )
    onUpdate(updated)
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Medical & Emergency Info</h2>
        <p className="text-sm text-gray-500 mt-1">
          This information helps our coaches and athletic trainers keep your player safe.
          All fields are optional but recommended.
        </p>
      </div>
      
      <div className="space-y-6">
        {players.map(player => (
          <Card key={player.id} className="p-5">
            <h3 className="font-medium text-gray-900 mb-4">
              {player.first_name} {player.last_name}
            </h3>
            
            <div className="space-y-4">
              {/* Medical conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Conditions
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  rows={2}
                  placeholder="e.g., Asthma, diabetes, heart condition..."
                  value={player.medical_conditions || ''}
                  onChange={(e) => handleChange(player.id, 'medical_conditions', e.target.value)}
                />
              </div>
              
              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  rows={2}
                  placeholder="e.g., Peanuts, bee stings, penicillin..."
                  value={player.allergies || ''}
                  onChange={(e) => handleChange(player.id, 'allergies', e.target.value)}
                />
              </div>
              
              {/* Emergency contact */}
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Emergency Contact (if different from you)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Name"
                    placeholder="Contact name"
                    value={player.emergency_contact_name || ''}
                    onChange={(e) => handleChange(player.id, 'emergency_contact_name', e.target.value)}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={player.emergency_contact_phone || ''}
                    onChange={(e) => handleChange(player.id, 'emergency_contact_phone', e.target.value)}
                  />
                  <Input
                    label="Relationship"
                    placeholder="e.g., Grandmother"
                    value={player.emergency_contact_relationship || ''}
                    onChange={(e) => handleChange(player.id, 'emergency_contact_relationship', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Info box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p>
          <strong>Note:</strong> Athletic trainers are present at all matches. 
          If your player has any conditions that coaches should be aware of, 
          please include them above.
        </p>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
