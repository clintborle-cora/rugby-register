'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ProgressSteps, ProgressStepsMobile, type Step } from '@/components/ui/progress-steps'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GuardianStep } from './steps/guardian-step'
import { PlayersStep } from './steps/players-step'
import { DocumentsStep } from './steps/documents-step'
import { MedicalStep } from './steps/medical-step'
import { ReviewStep } from './steps/review-step'
import type { Club, Season } from '@/types'
import type { GuardianFormData, PlayerFormData } from '@/lib/validations'
import { ArrowLeft, ArrowRight, Save, Cloud, CloudOff } from 'lucide-react'
import { saveDraftRegistration } from '@/lib/actions/registration'
import { calculateUsaRugbyFee } from '@/lib/utils'

const STEPS: Step[] = [
  { id: 'guardian', title: 'Your Info', description: 'Parent/Guardian details' },
  { id: 'players', title: 'Player(s)', description: 'Add your children' },
  { id: 'documents', title: 'Documents', description: 'Upload photos & proof' },
  { id: 'medical', title: 'Medical', description: 'Emergency & health info' },
  { id: 'review', title: 'Review & Pay', description: 'Confirm and checkout' },
]

export interface RegistrationData {
  guardian: GuardianFormData | null
  players: (PlayerFormData & { 
    id: string // temp ID for tracking
    division: string
    headshot?: { file: File; preview: string }
    dobDocument?: { file: File; name: string }
  })[]
  waivers: {
    socal_waiver_accepted: boolean
    usa_rugby_waiver_accepted: boolean
    club_waiver_accepted: boolean
  }
}

interface RegistrationWizardProps {
  club: Club
  season: Season
  existingGuardian?: GuardianFormData // If returning user
  existingPlayers?: RegistrationData['players'] // Draft players
  initialStep?: number // Resume from saved step
  guardianId?: string // For auto-save
  isLoggedIn?: boolean
}

export function RegistrationWizard({
  club,
  season,
  existingGuardian,
  existingPlayers,
  initialStep = 0,
  guardianId,
  isLoggedIn = false,
}: RegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [highestCompletedStep, setHighestCompletedStep] = useState(initialStep > 0 ? initialStep - 1 : -1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [data, setData] = useState<RegistrationData>({
    guardian: existingGuardian || null,
    players: existingPlayers || [],
    waivers: {
      socal_waiver_accepted: false,
      usa_rugby_waiver_accepted: false,
      club_waiver_accepted: false,
    },
  })

  // Auto-save draft when data changes (debounced)
  useEffect(() => {
    if (!isLoggedIn || !guardianId) return
    if (!data.guardian && data.players.length === 0) return

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setSaveStatus('saving')

    // Debounce save by 2 seconds
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveDraftRegistration(
          club.id,
          season.slug,
          guardianId,
          data,
          currentStep
        )
        setSaveStatus('saved')
        // Reset to idle after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000)
      } catch (error) {
        console.error('Auto-save failed:', error)
        setSaveStatus('error')
      }
    }, 2000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [data, currentStep, isLoggedIn, guardianId, club.id, season.slug])
  
  const updateGuardian = useCallback((guardian: GuardianFormData) => {
    setData(prev => ({ ...prev, guardian }))
  }, [])
  
  const updatePlayers = useCallback((players: RegistrationData['players']) => {
    setData(prev => ({ ...prev, players }))
  }, [])
  
  const updateWaivers = useCallback((waivers: RegistrationData['waivers']) => {
    setData(prev => ({ ...prev, waivers }))
  }, [])
  
  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      // Mark current step as completed when moving forward
      setHighestCompletedStep(prev => Math.max(prev, currentStep))
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  const goToStep = useCallback((stepIndex: number) => {
    // Can always go backward, or forward to already-completed steps
    if (stepIndex < currentStep || stepIndex <= highestCompletedStep) {
      setCurrentStep(stepIndex)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep, highestCompletedStep])
  
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0: // Guardian
        return data.guardian !== null
      case 1: // Players
        return data.players.length > 0
      case 2: // Documents - optional now, handled in DocumentsStep with skip checkbox
        return true
      case 3: // Medical
        return true // Medical info is optional
      case 4: // Review
        return (
          data.waivers.socal_waiver_accepted &&
          data.waivers.usa_rugby_waiver_accepted &&
          data.waivers.club_waiver_accepted
        )
      default:
        return false
    }
  }, [currentStep, data])
  
  const handleSubmit = async () => {
    if (!data.guardian) return
    setIsSubmitting(true)
    try {
      const playerNames = data.players.map(
        (p) => `${p.first_name} ${p.last_name}`
      )
      let totalAmountCents = 0
      data.players.forEach((player) => {
        totalAmountCents += club.club_dues_cents
        totalAmountCents += calculateUsaRugbyFee(
          player.division,
          club.settings.usa_rugby_fees
        )
      })
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerNames,
          totalAmountCents,
          clubName: club.name,
          clubSlug: club.slug,
          guardianEmail: data.guardian.email,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Checkout failed')
      }
      const { url } = await res.json()
      if (url) {
        window.location.href = url
        return
      }
      throw new Error('No checkout URL returned')
    } catch (error) {
      console.error('Registration failed:', error)
      setIsSubmitting(false)
    }
  }
  
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <GuardianStep
            initialData={data.guardian}
            onSave={updateGuardian}
            onNext={nextStep}
          />
        )
      case 1:
        return (
          <PlayersStep
            club={club}
            players={data.players}
            onUpdate={updatePlayers}
            onNext={nextStep}
            onBack={prevStep}
          />
        )
      case 2:
        return (
          <DocumentsStep
            players={data.players}
            onUpdate={updatePlayers}
            onNext={nextStep}
            onBack={prevStep}
          />
        )
      case 3:
        return (
          <MedicalStep
            players={data.players}
            onUpdate={updatePlayers}
            onNext={nextStep}
            onBack={prevStep}
          />
        )
      case 4:
        return (
          <ReviewStep
            club={club}
            season={season}
            data={data}
            waivers={data.waivers}
            onUpdateWaivers={updateWaivers}
            onSubmit={handleSubmit}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return null
    }
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Club header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {club.name} Registration
        </h1>
        <p className="text-gray-600 mt-2">
          {season.name} Season
        </p>
        {/* Save status indicator */}
        {isLoggedIn && (
          <div className="mt-2 flex items-center justify-center text-sm">
            {saveStatus === 'saving' && (
              <span className="text-gray-500 flex items-center">
                <Save className="h-3 w-3 mr-1 animate-pulse" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-green-600 flex items-center">
                <Cloud className="h-3 w-3 mr-1" />
                Progress saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-600 flex items-center">
                <CloudOff className="h-3 w-3 mr-1" />
                Save failed
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Progress steps - desktop */}
      <div className="hidden sm:block mb-8">
        <ProgressSteps
          steps={STEPS}
          currentStep={currentStep}
          highestCompletedStep={highestCompletedStep}
          onStepClick={goToStep}
        />
      </div>
      
      {/* Progress steps - mobile */}
      <div className="sm:hidden mb-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          <span>{STEPS[currentStep].title}</span>
        </div>
        {/* Clickable step dots */}
        <div className="flex justify-between mb-2">
          {STEPS.map((step, index) => {
            const isComplete = index < currentStep || index <= highestCompletedStep
            const isCurrent = index === currentStep
            const isClickable = index < currentStep || index <= highestCompletedStep
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-primary-600 text-white'
                    : isComplete
                    ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    : 'bg-gray-100 text-gray-400'
                } ${isClickable && !isCurrent ? 'cursor-pointer' : 'cursor-default'}`}
                title={step.title}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Step content */}
      <Card className="p-6 sm:p-8">
        {renderStep()}
      </Card>
      
      {/* Help text */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Questions? Contact{' '}
        <a href={`mailto:${club.contact_email}`} className="text-primary-600 hover:underline">
          {club.contact_email}
        </a>
      </p>
    </div>
  )
}
