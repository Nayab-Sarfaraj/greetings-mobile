"use client";
import { useState } from "react";
import type { Guest } from "@greetings/shared";
import { digits, guestShareText, smsLink } from "./guest-share";

function url(token: string) {
  return new URL(`/i/${token}`, window.location.origin).toString();
}

export function GuestList({
  guests,
  removing,
  onRemove,
}: {
  guests: Guest[];
  removing: boolean;
  onRemove: (id: string) => void;
}) {
  const [notice, setNotice] = useState("");
  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(message);
    } catch {
      setNotice("Copy failed. Select and copy the link manually.");
    }
  }
  if (!guests.length)
    return <p>No guests yet. Add one person or review a CSV import.</p>;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p>{guests.length}/200 guests</p>
        <button
          type="button"
          className="underline"
          onClick={() =>
            void copy(
              guests
                .map((item) => `${item.name}: ${url(item.token)}`)
                .join("\n"),
              "All guest links copied.",
            )
          }
        >
          Copy all links
        </button>
      </div>
      <ul className="divide-y rounded-lg border border-ink/20">
        {guests.map((guest) => {
          const phone =
            guest.contact?.method === "phone"
              ? digits(guest.contact.value)
              : "";
          return (
            <li key={guest.id} className="p-3">
              <p className="font-medium">{guest.name}</p>
              <p className="break-all text-sm">/i/{guest.token}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  className="underline"
                  onClick={() =>
                    void copy(url(guest.token), "Guest link copied.")
                  }
                >
                  Copy
                </button>
                {phone && (
                  <>
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
                        const text = guestShareText(
                          guest.name,
                          url(guest.token),
                        );
                        window.location.assign(
                          `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
                        );
                      }}
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
                        const ios = /iPad|iPhone|iPod/.test(
                          navigator.userAgent,
                        );
                        window.location.assign(
                          smsLink(
                            guest.contact!.value,
                            guestShareText(guest.name, url(guest.token)),
                            ios,
                          ),
                        );
                      }}
                    >
                      SMS
                    </button>
                  </>
                )}
                <button
                  type="button"
                  disabled={removing}
                  className="text-red-800 underline disabled:opacity-50"
                  onClick={() => {
                    if (confirm(`Delete ${guest.name}'s guest link?`))
                      onRemove(guest.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {notice && <p role="status">{notice}</p>}
    </div>
  );
}
