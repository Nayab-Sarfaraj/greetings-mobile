"use client";
import { useState } from "react";
import type { GuestInput } from "@greetings/shared";
import { CsvImport } from "./csv-import";
import { GuestList } from "./guest-list";
import { useGuestActions, useGuests } from "./use-guests";

function input(name: string, contact: string): GuestInput {
  const value = contact.trim();
  return {
    name,
    ...(value
      ? {
          contact: value.includes("@")
            ? { method: "email" as const, value }
            : { method: "phone" as const, value },
        }
      : {}),
  };
}

export function GuestManager({ invitationId }: { invitationId: string }) {
  const query = useGuests(invitationId);
  const actions = useGuestActions(invitationId);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const errors = [
    actions.add.error,
    actions.importGuests.error,
    actions.remove.error,
    actions.removeAll.error,
  ].filter(Boolean) as Error[];
  return (
    <section className="mt-5 space-y-4 border-t border-ink/20 pt-4">
      <div>
        <h3 className="font-display text-xl">Personal guest links</h3>
        <p className="text-sm">
          Each link shows that guest’s name. Your reply contact is visible to
          everyone who has a guest link.
        </p>
      </div>
      <form
        className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          actions.add.mutate(input(name, contact), {
            onSuccess: () => {
              setName("");
              setContact("");
            },
          });
        }}
      >
        <label className="text-sm font-medium">
          Guest name
          <input
            value={name}
            maxLength={40}
            required
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </label>
        <label className="text-sm font-medium">
          Email or phone (optional)
          <input
            value={contact}
            maxLength={160}
            onChange={(event) => setContact(event.target.value)}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </label>
        <button
          type="submit"
          disabled={actions.add.isPending || (query.data?.length ?? 0) >= 200}
          className="self-end rounded-full border px-4 py-2 disabled:opacity-50"
        >
          {actions.add.isPending ? "Adding…" : "Add guest"}
        </button>
      </form>
      <CsvImport
        pending={actions.importGuests.isPending}
        onImport={(guests) => actions.importGuests.mutate(guests)}
      />
      {query.isPending && <p role="status">Loading guest links…</p>}
      {query.error && <p role="alert">{query.error.message}</p>}
      {query.data && (
        <GuestList
          guests={query.data}
          removing={actions.remove.isPending}
          onRemove={(id) => actions.remove.mutate(id)}
        />
      )}
      {(query.data?.length ?? 0) > 0 && (
        <button
          type="button"
          disabled={actions.removeAll.isPending}
          onClick={() => {
            if (confirm("Delete every guest link for this invitation?"))
              actions.removeAll.mutate();
          }}
          className="text-sm text-red-800 underline disabled:opacity-50"
        >
          {actions.removeAll.isPending ? "Deleting…" : "Delete all guest links"}
        </button>
      )}
      {errors.length > 0 && <p role="alert">{errors[0].message}</p>}
    </section>
  );
}
