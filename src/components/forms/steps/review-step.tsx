'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  formatCurrency,
  requiresWeightVerification,
  isFlagDivision,
  calculateUsaRugbyFee,
} from '@/lib/utils'
import type { Club, Season } from '@/types'
import type { RegistrationData } from '../registration-wizard'
import { ArrowLeft, CreditCard, AlertCircle, MapPin, Calendar, Mail } from 'lucide-react'

interface ReviewStepProps {
  club: Club
  season: Season
  data: RegistrationData
  waivers: RegistrationData['waivers']
  onUpdateWaivers: (waivers: RegistrationData['waivers']) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function ReviewStep({
  club,
  season,
  data,
  waivers,
  onUpdateWaivers,
  onSubmit,
  onBack,
  isSubmitting,
}: ReviewStepProps) {
  // Calculate fees
  const calculateTotal = () => {
    let total = 0
    
    data.players.forEach(player => {
      // Club dues
      total += club.club_dues_cents
      
      // USA Rugby fee based on division
      const usaFee = calculateUsaRugbyFee(player.division, club.settings.usa_rugby_fees)
      total += usaFee
    })
    
    return total
  }
  
  const totalCents = calculateTotal()
  const clubDuesCents = club.club_dues_cents * data.players.length
  const usaRugbyCents = totalCents - clubDuesCents
  
  const handleWaiverChange = (field: keyof typeof waivers) => {
    onUpdateWaivers({ ...waivers, [field]: !waivers[field] })
  }
  
  const allWaiversAccepted =
    waivers.socal_waiver_accepted &&
    waivers.usa_rugby_waiver_accepted &&
    waivers.club_waiver_accepted
  
  // Find players needing weight verification
  const playersNeedingWeight = data.players.filter(p =>
    requiresWeightVerification(p.division)
  )
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Review & Pay</h2>
        <p className="text-sm text-gray-500 mt-1">
          Please review your registration details and accept the waivers to continue.
        </p>
      </div>
      
      {/* Summary */}
      <Card className="p-5">
        <h3 className="font-medium text-gray-900 mb-4">Registration Summary</h3>
        
        {/* Guardian */}
        <div className="text-sm text-gray-600 mb-4">
          <span className="font-medium">Guardian:</span>{' '}
          {data.guardian?.first_name} {data.guardian?.last_name} ({data.guardian?.email})
        </div>
        
        {/* Players */}
        <div className="space-y-3">
          {data.players.map(player => (
            <div
              key={player.id}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div>
                <span className="font-medium">
                  {player.first_name} {player.last_name}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={isFlagDivision(player.division) ? 'info' : 'default'}>
                    {player.division}
                  </Badge>
                  {requiresWeightVerification(player.division) && (
                    <span className="text-xs text-amber-600">Weight verification required</span>
                  )}
                </div>
              </div>
              <div className="text-right text-sm">
                <div>Club dues: {formatCurrency(club.club_dues_cents)}</div>
                <div className="text-gray-500">
                  USA Rugby: {formatCurrency(calculateUsaRugbyFee(player.division, club.settings.usa_rugby_fees))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary-600">
            {formatCurrency(totalCents)}
          </span>
        </div>
      </Card>
      
      {/* Weight verification notice */}
      {playersNeedingWeight.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900">Weight Verification Required</h4>
              <p className="text-sm text-amber-800 mt-1">
                {playersNeedingWeight.map(p => p.first_name).join(' and ')}{' '}
                must attend an in-person weigh-in before playing.
              </p>
              <div className="mt-3 text-sm">
                <div className="flex items-center gap-2 text-amber-800">
                  <Calendar className="h-4 w-4" />
                  <span>Saturday, December 7, 2025 • 9am - 12pm</span>
                </div>
                <div className="flex items-center gap-2 text-amber-800 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>Torrey Pines Elementary, La Jolla</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* What happens next */}
      <Card className="p-5 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3">What Happens Next</h3>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
              1
            </span>
            <span>We'll register your player(s) with SoCal Youth Rugby and USA Rugby on your behalf</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
              2
            </span>
            <div>
              <span>You'll receive an email from USA Rugby to verify age</span>
              <div className="flex items-center gap-1 text-amber-600 mt-1">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-xs">Check your spam folder!</span>
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
              3
            </span>
            <span>
              Practice starts {club.settings.practice_schedule || 'soon'} at{' '}
              {club.settings.practice_location || 'the club field'}
            </span>
          </li>
        </ol>
      </Card>
      
      {/* Waivers */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Waivers & Agreements</h3>
        
        <Checkbox
          checked={waivers.socal_waiver_accepted}
          onChange={() => handleWaiverChange('socal_waiver_accepted')}
          label={
            <span>
              I accept the{' '}
              <a href="#" className="text-primary-600 hover:underline">
                SoCal Youth Rugby waiver
              </a>{' '}
              on behalf of my player(s)
            </span>
          }
        />
        
        <Checkbox
          checked={waivers.usa_rugby_waiver_accepted}
          onChange={() => handleWaiverChange('usa_rugby_waiver_accepted')}
          label={
            <span>
              I accept the{' '}
              <a href="#" className="text-primary-600 hover:underline">
                USA Rugby participant agreement
              </a>{' '}
              on behalf of my player(s)
            </span>
          }
        />
        
        <Checkbox
          checked={waivers.club_waiver_accepted}
          onChange={() => handleWaiverChange('club_waiver_accepted')}
          label={
            <span>
              I accept the{' '}
              <a href="#" className="text-primary-600 hover:underline">
                {club.name} code of conduct
              </a>
            </span>
          }
        />
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!allWaiversAccepted || isSubmitting}
          loading={isSubmitting}
          className="min-w-[200px]"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Pay {formatCurrency(totalCents)}
        </Button>
      </div>
    </div>
  )
}
