// Next.js 16 : la convention `middleware.ts` a été renommée `proxy.ts`.
// Cette fonction est appelée par Next.js avant le rendu des routes — elle
// rafraîchit les cookies de session Supabase pour éviter une déconnexion
// silencieuse pendant qu'une session est active.
//
// La logique réelle vit dans lib/supabase/middleware.ts pour faciliter les
// tests unitaires futurs.

import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // On exécute le proxy sur toutes les routes SAUF les assets statiques
  // (Next.js _next, favicon, images publiques).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
