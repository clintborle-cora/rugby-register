import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  error?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || props.name
    
    return (
      <div className="flex flex-col">
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              id={checkboxId}
              className={cn(
                'peer h-5 w-5 appearance-none rounded border bg-white transition-colors',
                'checked:bg-primary-600 checked:border-primary-600',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                error ? 'border-red-300' : 'border-gray-300',
                'disabled:cursor-not-allowed disabled:bg-gray-50',
                className
              )}
              ref={ref}
              {...props}
            />
            <Check 
              className="absolute top-0.5 left-0.5 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" 
              strokeWidth={3}
            />
          </div>
          {label && (
            <span className="text-sm text-gray-700 select-none">{label}</span>
          )}
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-600 ml-8">{error}</p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
