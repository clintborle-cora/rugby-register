import { CheckCircle, Mail, Calendar, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface PageProps {
  params: Promise<{ club: string }>
  searchParams: Promise<{ session_id?: string }>
}

export default async function SuccessPage({ params, searchParams }: PageProps) {
  const { club: clubSlug } = await params
  const { session_id } = await searchParams

  // In production, fetch session details from Stripe and registration data from DB
  // For now, show a generic success message

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center">
        {/* Success icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Registration Complete!
        </h1>
        <p className="text-gray-600 mb-8">
          Thank you for registering. We've sent a confirmation email with all the details.
        </p>

        {/* What's next */}
        <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">What Happens Next</h2>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  We'll register your player(s) with SoCal Youth Rugby and USA Rugby
                </p>
                <p className="text-sm text-gray-500">
                  This usually takes 24-48 hours
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-amber-500" />
                  Check for USA Rugby verification email
                </p>
                <p className="text-sm text-gray-500">
                  Look for an email from info@yhsverification.rugby — check spam!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Practice starts soon!
                </p>
                <p className="text-sm text-gray-500">
                  Tuesdays & Thursdays at 5:30pm
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weight verification notice - conditionally show */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-left">
          <h3 className="font-medium text-amber-900 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Weight Verification Required
          </h3>
          <p className="text-sm text-amber-800 mt-1">
            U10 and U12 players must attend a weigh-in before playing.
          </p>
          <div className="text-sm text-amber-800 mt-2">
            <strong>Next weigh-in:</strong> Saturday, December 7, 9am-12pm
            <br />
            <strong>Location:</strong> Torrey Pines Elementary, La Jolla
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/${clubSlug}`}>
              Register Another Player
            </Link>
          </Button>
          <Button asChild className="flex-1">
            <a href="https://stingraysrfc.com">
              Back to Club Website
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </Card>
    </div>
  )
}
