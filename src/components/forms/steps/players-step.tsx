'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { playerSchema, type PlayerFormData } from '@/lib/validations'
import { calculateDivision, requiresWeightVerification, isFlagDivision } from '@/lib/utils'
import type { Club } from '@/types'
import { ArrowLeft, ArrowRight, Plus, Trash2, AlertCircle } from 'lucide-react'

type PlayerWithMeta = PlayerFormData & {
  id: string
  division: string
  headshot?: { file: File; preview: string }
  dobDocument?: { file: File; name: string }
}

interface PlayersStepProps {
  club: Club
  players: PlayerWithMeta[]
  onUpdate: (players: PlayerWithMeta[]) => void
  onNext: () => void
  onBack: () => void
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

export function PlayersStep({ club, players, onUpdate, onNext, onBack }: PlayersStepProps) {
  const [editingPlayer, setEditingPlayer] = useState<PlayerWithMeta | null>(
    players.length === 0
      ? {
          id: crypto.randomUUID(),
          first_name: '',
          last_name: '',
          date_of_birth: '',
          gender: 'male' as const,
          division: '',
        }
      : null
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingPlayer) return
    
    const { name, value } = e.target
    let updatedPlayer = { ...editingPlayer, [name]: value }
    
    // Recalculate division when DOB or gender changes
    if ((name === 'date_of_birth' || name === 'gender') && updatedPlayer.date_of_birth) {
      updatedPlayer.division = calculateDivision(
        updatedPlayer.date_of_birth,
        updatedPlayer.gender as 'male' | 'female' | 'other'
      )
    }
    
    setEditingPlayer(updatedPlayer)
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  
  const handleSavePlayer = () => {
    if (!editingPlayer) return
    
    const result = playerSchema.safeParse(editingPlayer)
    
    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(newErrors)
      return
    }
    
    // Update or add player
    const existingIndex = players.findIndex(p => p.id === editingPlayer.id)
    if (existingIndex >= 0) {
      const updated = [...players]
      updated[existingIndex] = editingPlayer
      onUpdate(updated)
    } else {
      onUpdate([...players, editingPlayer])
    }
    
    setEditingPlayer(null)
    setErrors({})
  }
  
  const handleEditPlayer = (player: PlayerWithMeta) => {
    setEditingPlayer({ ...player })
    setErrors({})
  }
  
  const handleRemovePlayer = (id: string) => {
    onUpdate(players.filter(p => p.id !== id))
  }
  
  const handleAddAnother = () => {
    setEditingPlayer({
      id: crypto.randomUUID(),
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'male' as const,
      division: '',
    })
    setErrors({})
  }
  
  const handleContinue = () => {
    if (players.length === 0) {
      // Must have at least one player
      return
    }
    onNext()
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Player Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add the player(s) you want to register. You can register multiple children.
        </p>
      </div>
      
      {/* Existing players */}
      {players.length > 0 && !editingPlayer && (
        <div className="space-y-3">
          {players.map(player => (
            <Card key={player.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {player.first_name} {player.last_name}
                    </span>
                    <Badge variant={isFlagDivision(player.division) ? 'info' : 'default'}>
                      {player.division}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    DOB: {new Date(player.date_of_birth).toLocaleDateString()}
                  </p>
                  {requiresWeightVerification(player.division) && (
                    <div className="flex items-center gap-1 text-sm text-amber-600 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Weight verification required
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPlayer(player)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePlayer(player.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={handleAddAnother}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Player
          </Button>
        </div>
      )}
      
      {/* Player form */}
      {editingPlayer && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="first_name"
              required
              value={editingPlayer.first_name}
              onChange={handleChange}
              error={errors.first_name}
            />
            <Input
              label="Last Name"
              name="last_name"
              required
              value={editingPlayer.last_name}
              onChange={handleChange}
              error={errors.last_name}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              name="date_of_birth"
              type="date"
              required
              value={editingPlayer.date_of_birth}
              onChange={handleChange}
              error={errors.date_of_birth}
            />
            <Select
              label="Gender"
              name="gender"
              required
              value={editingPlayer.gender}
              onChange={handleChange}
              error={errors.gender}
              options={GENDER_OPTIONS}
            />
          </div>
          
          {/* Division display */}
          {editingPlayer.division && (
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Division:</span>
                <div className="flex items-center gap-2">
                  <Badge variant={isFlagDivision(editingPlayer.division) ? 'info' : 'success'}>
                    {editingPlayer.division}
                  </Badge>
                  {isFlagDivision(editingPlayer.division) && (
                    <span className="text-xs text-gray-500">(Non-contact flag rugby)</span>
                  )}
                </div>
              </div>
              {requiresWeightVerification(editingPlayer.division) && (
                <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  This division requires weight verification at an in-person weigh-in
                </p>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-2">
            {players.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingPlayer(null)
                  setErrors({})
                }}
              >
                Cancel
              </Button>
            )}
            <Button type="button" onClick={handleSavePlayer}>
              {players.find(p => p.id === editingPlayer.id) ? 'Save Changes' : 'Add Player'}
            </Button>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={players.length === 0 || editingPlayer !== null}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
