'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface Step {
  id: string
  title: string
  description?: string
}

interface ProgressStepsProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isComplete = index < currentStep
          const isCurrent = index === currentStep
          
          return (
            <li
              key={step.id}
              className={cn(
                'relative',
                index !== steps.length - 1 && 'pr-8 sm:pr-20 flex-1'
              )}
            >
              {/* Connector line */}
              {index !== steps.length - 1 && (
                <div
                  className="absolute top-4 left-8 -ml-px h-0.5 w-full sm:w-auto sm:flex-1"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full w-full',
                      isComplete ? 'bg-primary-600' : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
              
              <div className="group relative flex items-start">
                {/* Circle */}
                <span className="flex h-9 items-center" aria-hidden="true">
                  <span
                    className={cn(
                      'relative z-10 flex h-8 w-8 items-center justify-center rounded-full',
                      isComplete
                        ? 'bg-primary-600'
                        : isCurrent
                        ? 'border-2 border-primary-600 bg-white'
                        : 'border-2 border-gray-300 bg-white'
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    ) : (
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isCurrent ? 'text-primary-600' : 'text-gray-500'
                        )}
                      >
                        {index + 1}
                      </span>
                    )}
                  </span>
                </span>
                
                {/* Label */}
                <span className="ml-4 flex min-w-0 flex-col">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-primary-600' : isComplete ? 'text-gray-900' : 'text-gray-500'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-sm text-gray-500 hidden sm:block">
                      {step.description}
                    </span>
                  )}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Mobile-friendly version (vertical)
export function ProgressStepsMobile({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="space-y-4">
        {steps.map((step, index) => {
          const isComplete = index < currentStep
          const isCurrent = index === currentStep
          
          return (
            <li key={step.id} className="relative flex gap-4">
              {/* Connector line */}
              {index !== steps.length - 1 && (
                <div
                  className="absolute left-4 top-8 -ml-px h-full w-0.5"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full w-full',
                      isComplete ? 'bg-primary-600' : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
              
              {/* Circle */}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  isComplete
                    ? 'bg-primary-600'
                    : isCurrent
                    ? 'border-2 border-primary-600 bg-white'
                    : 'border-2 border-gray-300 bg-white'
                )}
              >
                {isComplete ? (
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                ) : (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-primary-600' : 'text-gray-500'
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </span>
              
              {/* Label */}
              <span className="flex flex-col pt-1">
                <span
                  className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-primary-600' : isComplete ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-sm text-gray-500">{step.description}</span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
