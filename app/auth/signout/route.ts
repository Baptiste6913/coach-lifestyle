import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Signout volontairement en POST (pas GET) pour éviter prefetch / CSRF
// involontaire. Le bouton logout dans (app)/layout.tsx fera un POST.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/login`, { status: 303 })
}
