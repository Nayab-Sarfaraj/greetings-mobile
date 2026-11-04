"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Template } from "@greetings/remotion/templates";

export function TemplatePicker({ templates }: { templates: Template[] }) {
  const [type, setType] = useState<Template["type"]>("card");
  const visible = templates.filter((template) => template.type === type);
  return (
    <>
      <div className="mt-10 flex gap-3" role="group" aria-label="Template type">
        {(["card", "invitation"] as const).map((option) => (
          <button
            type="button"
            key={option}
            aria-pressed={type === option}
            onClick={() => setType(option)}
            className={`rounded-full px-5 py-3 focus-visible:outline-4 focus-visible:outline-accent ${type === option ? "bg-accent text-white" : "border border-accent"}`}
          >
            {option === "card" ? "Cards" : "Invitations"}
          </button>
        ))}
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {visible.map((template) => (
          <Link
            key={template.id}
            href={`/create/${template.id}`}
            className="group overflow-hidden rounded-2xl border border-ink/20 bg-white/45 focus-visible:outline-4 focus-visible:outline-accent"
          >
            <div className="aspect-[9/12] overflow-hidden bg-accent">
              <Image
                src={`/posters/${template.id}.png`}
                alt={`${template.title} preview`}
                width={432}
                height={768}
                className="h-full w-full object-cover"
              />
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
    </>
  );
}
