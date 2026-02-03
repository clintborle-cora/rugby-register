
'use client'

import { useState, useCallback } from 'react'
import { ProgressSteps, type Step } from '@/components/ui/progress-steps'
import { Card } from '@/components/ui/card'
import { GuardianStep } from './steps/guardian-step'
import { PlayersStep } from './steps/players-step'
import { DocumentsStep } from './steps/documents-step'
import { MedicalStep } from './steps/medical-step'
import { ReviewStep } from './steps/review-step'
import type { Club, Season } from '@/types'
import type { GuardianFormData, PlayerFormData } from '@/lib/validations'

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
    id: string
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
  existingGuardian?: GuardianFormData
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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const playerNames = data.players.map(p => `${p.first_name} ${p.last_name}`)

      let totalCents = 0
      data.players.forEach(player => {
        totalCents += club.club_dues_cents
        const isFlag = player.division === 'U8'
        const usaFee = isFlag
          ? club.settings.usa_rugby_fees.flag
          : club.settings.usa_rugby_fees.contact
        totalCents += usaFee
      })

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerNames,
          totalAmountCents: totalCents,
          clubName: club.name,
          guardianEmail: data.guardian?.email,
        }),
      })

      const result = await response.json()

      if (result.url) {
        window.location.href = result.url
      } else {
        console.error('No checkout URL returned:', result)
        alert('Payment failed to initialize. Please try again.')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      alert('Something went wrong. Please try again.')
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
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {club.name} Registration
        </h1>
        <p className="text-gray-600 mt-2">
          {season.name} Season
        </p>
      </div>

      <div className="hidden sm:block mb-8">
        <ProgressSteps steps={STEPS} currentStep={currentStep} />
      </div>

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

      <Card className="p-6 sm:p-8">
        {renderStep()}
      </Card>

      <p className="text-center text-sm text-gray-500 mt-6">
        Questions? Contact{' '}
        <a href={`mailto:${club.contact_email}`} className="text-primary-600 hover:underline">
          {club.contact_email}
        </a>
      </p>
    </div>
  )
}
