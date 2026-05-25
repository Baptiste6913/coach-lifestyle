import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Magic link callback :
// Supabase redirige ici avec `?code=...` après que l'utilisateur ait cliqué
// sur le lien magique. On échange le code contre une session côté serveur
// (qui set les cookies httpOnly), puis on redirige vers la destination finale.
//
// `next` est le paramètre optionnel pour rediriger vers une route spécifique
// après le login (ex: deep link). Par défaut → /dashboard.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    )
  }

  // `next` doit être un path interne (pas une URL externe) — guard simple.
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  return NextResponse.redirect(`${origin}${safeNext}`)
}
