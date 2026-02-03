'use client'

import { useState, useCallback } from 'react'
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
import { ArrowLeft, ArrowRight } from 'lucide-react'

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
}

export function RegistrationWizard({ club, season, existingGuardian }: RegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [data, setData] = useState<RegistrationData>({
    guardian: existingGuardian || null,
    players: [],
    waivers: {
      socal_waiver_accepted: false,
      usa_rugby_waiver_accepted: false,
      club_waiver_accepted: false,
    },
  })
  
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
  
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0: // Guardian
        return data.guardian !== null
      case 1: // Players
        return data.players.length > 0
      case 2: // Documents
        return data.players.every(p => p.headshot && p.dobDocument)
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
    setIsSubmitting(true)
    try {
      // TODO: Implement actual submission logic
      // 1. Create/update guardian in DB
      // 2. Create players in DB
      // 3. Upload documents to storage
      // 4. Create registrations
      // 5. Create Stripe checkout session
      // 6. Redirect to Stripe
      console.log('Submitting registration:', data)
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
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
      </div>
      
      {/* Progress steps - desktop */}
      <div className="hidden sm:block mb-8">
        <ProgressSteps steps={STEPS} currentStep={currentStep} />
      </div>
      
      {/* Progress steps - mobile */}
      <div className="sm:hidden mb-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          <span>{STEPS[currentStep].title}</span>
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
