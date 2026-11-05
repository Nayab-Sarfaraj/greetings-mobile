"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { themeNames, THEME_IDS, type ThemeId } from "@greetings/shared";
import type { Template } from "@greetings/remotion/templates";
import { orderTemplates } from "./template-order";

export function TemplatePicker({ templates }: { templates: Template[] }) {
  const [type, setType] = useState<Template["type"]>("card");
  const [theme, setTheme] = useState<ThemeId | "all">("all");
  const visible = orderTemplates(templates).filter(
    (template) =>
      template.type === type && (theme === "all" || template.themeId === theme),
  );
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
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Holiday theme"
      >
        {(["all", ...THEME_IDS] as const).map((option) => (
          <button
            type="button"
            key={option}
            aria-pressed={theme === option}
            onClick={() => setTheme(option)}
            className={`rounded-full px-4 py-2 text-sm focus-visible:outline-4 focus-visible:outline-accent ${theme === option ? "bg-ink text-paper" : "border border-ink/30"}`}
          >
            {option === "all" ? "All holidays" : themeNames[option]}
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
                  ? `Animated card · ${template.scenes.reduce((total, scene) => total + scene.seconds, 0)} sec`
                  : `Video invitation · ${template.scenes.reduce((total, scene) => total + scene.seconds, 0)} sec`}
              </p>
              <p className="mt-1 text-sm">{themeNames[template.themeId]}</p>
              <h2 className="mt-2 font-display text-2xl">{template.title}</h2>
              <p className="mt-3 underline underline-offset-4">
                Start customizing
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
