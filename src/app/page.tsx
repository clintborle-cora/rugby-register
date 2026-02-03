import { redirect } from 'next/navigation'

export default function Home() {
  // For now, redirect to the Stingrays registration
  // In the future, this could be a landing page or club selector
  redirect('/stingrays')
}
