import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t complete your sign in. This link may have expired or already been used.
        </p>
        <div className="space-y-3">
          <Link href="/login">
            <Button className="w-full">Try again</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Go to homepage
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
