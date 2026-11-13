import Link from "next/link";
import { Suspense } from "react";
import Loading from "../loading";
import { signIn, signUp } from "./actions";

// Skalet er statisk; skjemaet les ?mode/?error frå URL-en og blir strøyma inn
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginForm({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error, info, mode } = await searchParams;
  const isSignup = mode === "signup";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-5 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">NiceToKnow</h1>
        <p className="text-muted">Kodar, medlemskap og forsikringar – samla for oss to.</p>
      </header>

      <form action={isSignup ? signUp : signIn} className="card flex flex-col gap-3 p-5">
        <h2 className="text-lg font-semibold">{isSignup ? "Opprett konto" : "Logg inn"}</h2>
        <label className="flex flex-col gap-1 text-sm font-medium">
          E-post
          <input className="field" type="email" name="email" autoComplete="email" required />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Passord
          <input
            className="field"
            type="password"
            name="password"
            minLength={8}
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
          />
        </label>

        {typeof error === "string" && <p className="text-sm text-danger">{error}</p>}
        {typeof info === "string" && <p className="text-sm text-accent">{info}</p>}

        <button className="btn-primary mt-1">{isSignup ? "Opprett konto" : "Logg inn"}</button>
      </form>

      <p className="text-center text-sm text-muted">
        {isSignup ? "Har du konto? " : "Ny her? "}
        <Link className="font-semibold text-accent" href={isSignup ? "/login" : "/login?mode=signup"}>
          {isSignup ? "Logg inn" : "Opprett konto"}
        </Link>
      </p>
    </main>
  );
}
