import { SignIn } from "@clerk/clerk-react"

export function LoginPage() {
  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
        <div className="absolute top-6 left-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            alenna<span className="text-gray-400">.</span>
          </h1>
        </div>
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
          appearance={{
            elements: {
              card: "rounded-2xl border border-gray-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] bg-white",
              logoImage: "hidden",
              logoBox: "hidden",
              headerTitle: "text-2xl font-semibold tracking-tight text-gray-900",
              headerSubtitle: "text-sm text-gray-500",
              socialButtonsBlockButton: "rounded-lg border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 hover:bg-white hover:border-indigo-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200",
              formButtonPrimary: "rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/30 transition-all duration-200",
              formFieldInput: "mt-2 rounded-lg border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200",
              formFieldLabel: "text-sm font-medium text-gray-700",
              badge: "rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 font-normal",
              alert: "rounded-lg border border-orange-200 bg-orange-50 py-2 text-center text-xs text-orange-600",
            },
            variables: {
              colorPrimary: "#4F46E5",
              colorText: "#111827",
              colorTextSecondary: "#6B7280",
              borderRadius: "0.5rem",
            },
          }}
        />
      </div>
    </>
  )
}

