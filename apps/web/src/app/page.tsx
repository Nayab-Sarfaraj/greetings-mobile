import Link from "next/link";
import { templates } from "@greetings/remotion/templates";
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-medium text-accent">Seasonal Cards</p>
      <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">
        Make this season feel personal.
      </h1>
      <p className="mt-5 max-w-xl text-lg">
        Create a moving Thanksgiving greeting or invite everyone to your table.
      </p>
      <div className="mt-10 flex gap-3">
        <a href="#card" className="rounded-full bg-accent px-5 py-3 text-white">
          Cards
        </a>
        <a
          href="#invitation"
          className="rounded-full border border-accent px-5 py-3"
        >
          Invitations
        </a>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {templates.map((template) => (
          <Link
            key={template.id}
            id={template.type}
            href={`/create/${template.id}`}
            className="group overflow-hidden rounded-2xl border border-ink/20 bg-white/45 focus-visible:outline-4 focus-visible:outline-accent"
          >
            <div className="aspect-[9/12] overflow-hidden bg-accent">
              <img src={`/posters/${template.id}.png`} alt={`${template.title} preview`} className="h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <p className="text-sm text-accent">
                {template.type === "card"
                  ? "Animated card · 7 sec"
                  : "Video invitation · 25 sec"}
              </p>
              <h2 className="mt-2 font-display text-2xl">{template.title}</h2>
              <p className="mt-3 underline underline-offset-4">
                Customize template
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
