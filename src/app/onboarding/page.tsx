import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "../loading";
import { getSessionContext } from "@/lib/household";
import { signOut } from "../login/actions";
import { createHousehold, joinHousehold } from "./actions";

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <Suspense fallback={<Loading />}>
      <Onboarding searchParams={searchParams} />
    </Suspense>
  );
}

async function Onboarding({ searchParams }: Pick<PageProps<"/onboarding">, "searchParams">) {
  const { household } = await getSessionContext();
  if (household) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-5 px-5 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Velkomen!</h1>
        <p className="text-muted">
          Alt de lagrar blir delt i ein husstand. Opprett ein ny, eller bli med i partnaren sin.
        </p>
      </header>

      {typeof error === "string" && <p className="text-sm text-danger">{error}</p>}

      <form action={createHousehold} className="card flex flex-col gap-3 p-5">
        <h2 className="font-semibold">Opprett ny husstand</h2>
        <input className="field" name="name" placeholder="Namn, t.d. «Heime»" maxLength={80} />
        <button className="btn-primary">Opprett</button>
      </form>

      <form action={joinHousehold} className="card flex flex-col gap-3 p-5">
        <h2 className="font-semibold">Bli med via invitasjonskode</h2>
        <input className="field font-mono" name="code" placeholder="Kode frå partnaren" required autoCapitalize="none" autoCorrect="off" />
        <button className="btn-ghost">Bli med</button>
      </form>

      <form action={signOut} className="text-center">
        <button className="text-sm text-muted underline">Logg ut</button>
      </form>
    </main>
  );
}
