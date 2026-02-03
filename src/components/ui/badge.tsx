import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    }
    
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

// Status-specific badge component
interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    paid: { variant: 'warning', label: 'Paid - Pending' },
    submitted: { variant: 'info', label: 'Submitted' },
    pending_verification: { variant: 'warning', label: 'Awaiting Verification' },
    verified: { variant: 'success', label: 'Verified' },
    complete: { variant: 'success', label: 'Complete' },
    cancelled: { variant: 'error', label: 'Cancelled' },
    waitlist: { variant: 'info', label: 'Waitlist' },
  }
  
  const { variant, label } = config[status] || { variant: 'default', label: status }
  
  return <Badge variant={variant}>{label}</Badge>
}

export { Badge }
