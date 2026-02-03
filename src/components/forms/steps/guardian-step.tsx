'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { guardianSchema, type GuardianFormData } from '@/lib/validations'
import { ArrowRight } from 'lucide-react'

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

interface GuardianStepProps {
  initialData: GuardianFormData | null
  onSave: (data: GuardianFormData) => void
  onNext: () => void
}

export function GuardianStep({ initialData, onSave, onNext }: GuardianStepProps) {
  const [formData, setFormData] = useState<Partial<GuardianFormData>>(
    initialData || {
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
    }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const result = guardianSchema.safeParse(formData)
    
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
    
    onSave(result.data)
    onNext()
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Information</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your details as the parent or guardian registering the player(s).
          </p>
        </div>
        
        <Input
          label="Email Address"
          name="email"
          type="email"
          required
          value={formData.email || ''}
          onChange={handleChange}
          error={errors.email}
          placeholder="your@email.com"
          hint="We'll send registration confirmations to this email"
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="first_name"
            required
            value={formData.first_name || ''}
            onChange={handleChange}
            error={errors.first_name}
          />
          <Input
            label="Last Name"
            name="last_name"
            required
            value={formData.last_name || ''}
            onChange={handleChange}
            error={errors.last_name}
          />
        </div>
        
        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={handleChange}
          error={errors.phone}
          placeholder="(555) 123-4567"
        />
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Address (Optional)</h3>
          
          <Input
            label="Street Address"
            name="address_line1"
            value={formData.address_line1 || ''}
            onChange={handleChange}
          />
          
          <Input
            label="Apt, Suite, Unit"
            name="address_line2"
            value={formData.address_line2 || ''}
            onChange={handleChange}
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Input
                label="City"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
              />
            </div>
            <Select
              label="State"
              name="state"
              value={formData.state || ''}
              onChange={handleChange}
              options={US_STATES}
              placeholder="Select"
            />
            <Input
              label="ZIP Code"
              name="postal_code"
              value={formData.postal_code || ''}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button type="submit">
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  )
}
