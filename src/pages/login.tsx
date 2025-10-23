import { SignIn } from "@clerk/clerk-react"

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Welcome to Alenna</h1>
          <p className="mt-2 text-muted-foreground">Sign in to continue</p>
        </div>
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
        />
      </div>
    </div>
  )
}

