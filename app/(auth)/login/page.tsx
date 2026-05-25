import { LoginForm } from './login-form'

export const metadata = {
  title: 'Login — coach-lifestyle',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">coach-lifestyle</h1>
          <p className="text-sm text-neutral-500">
            Connexion par lien magique. Pas de mot de passe.
          </p>
        </header>
        <LoginForm />
      </div>
    </main>
  )
}
