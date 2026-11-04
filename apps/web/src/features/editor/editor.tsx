"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  cardSchema,
  getTemplate,
  invitationSchema,
  type VideoProps,
} from "@greetings/remotion";
const Preview = dynamic(() => import("./preview"), {
  ssr: false,
  loading: () => (
    <div
      className="aspect-[9/16] animate-pulse rounded-xl bg-ink/10"
      role="status"
    >
      Loading preview…
    </div>
  ),
});
type ContactMethod = "email" | "whatsapp" | "sms";
const labels: Record<string, string> = {
  senderName: "Your name",
  recipientName: "Recipient name",
  message: "Message",
  eventTitle: "Event title",
  hostName: "Host name",
  dateTime: "Date and time",
  locationText: "Location",
  mapUrl: "Map URL",
};
const limits: Record<string, number> = {
  senderName: 40,
  recipientName: 40,
  message: 240,
  eventTitle: 70,
  hostName: 40,
  locationText: 120,
};
export default function Editor({ templateId }: { templateId: string }) {
  const template = getTemplate(templateId)!;
  const [fields, setFields] = useState<VideoProps>(template.defaultProps);
  const [previewProps, setPreviewProps] = useState<VideoProps>(
    template.defaultProps,
  );
  const [photo, setPhoto] = useState<string>();
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [contactValue, setContactValue] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem(`draft:${templateId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFields({ ...template.defaultProps, ...parsed.fields });
          setContactMethod(parsed.contactMethod ?? "email");
          setContactValue(parsed.contactValue ?? "");
        } catch {
          localStorage.removeItem(`draft:${templateId}`);
        }
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [templateId, template.defaultProps]);
  useEffect(() => {
    if (ready)
      localStorage.setItem(
        `draft:${templateId}`,
        JSON.stringify({
          fields: { ...fields, photoUrl: undefined },
          contactMethod,
          contactValue,
        }),
      );
  }, [fields, contactMethod, contactValue, ready, templateId]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const candidate = { ...fields, photoUrl: photo };
      const parsed = (
        template.type === "card" ? cardSchema : invitationSchema
      ).safeParse(candidate);
      if (parsed.success) setPreviewProps(parsed.data);
    }, 250);
    return () => clearTimeout(timer);
  }, [fields, photo, template.type]);
  const errors = useMemo(() => {
    const parsed = (
      template.type === "card" ? cardSchema : invitationSchema
    ).safeParse(fields);
    return parsed.success
      ? {}
      : Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        );
  }, [fields, template.type]);
  const keys =
    template.type === "card"
      ? ["senderName", "recipientName", "message"]
      : [
          "eventTitle",
          "hostName",
          "dateTime",
          "locationText",
          "mapUrl",
          "message",
        ];
  function update(key: string, value: string) {
    setFields((old) => ({ ...old, [key]: value || undefined }) as VideoProps);
  }
  async function choosePhoto(file?: File) {
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas
        .getContext("2d")
        ?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (result) =>
            result
              ? resolve(result)
              : reject(new Error("Photo processing failed")),
          "image/jpeg",
          0.85,
        ),
      );
      setPhoto((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/" className="underline underline-offset-4">
        ← All templates
      </Link>
      <h1 className="mt-6 font-display text-4xl">{template.title}</h1>
      <p className="mt-2">Your changes appear in the preview as you type.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(280px,400px)_1fr]">
        <section aria-label="Video preview">
          <Preview templateId={templateId} props={previewProps} />
        </section>
        <section className="space-y-5">
          {keys.map((key) => {
            const value = String(
              (fields as unknown as Record<string, unknown>)[key] ?? "",
            );
            return (
              <div key={key}>
                <label htmlFor={key} className="block font-medium">
                  {labels[key]}
                </label>
                {key === "message" ? (
                  <textarea
                    id={key}
                    value={value}
                    maxLength={limits[key]}
                    rows={4}
                    onChange={(event) => update(key, event.target.value)}
                    className="mt-2 w-full rounded-lg border border-ink/40 bg-white p-3"
                  />
                ) : (
                  <input
                    id={key}
                    value={value}
                    maxLength={limits[key]}
                    type={
                      key === "dateTime"
                        ? "text"
                        : key === "mapUrl"
                          ? "url"
                          : "text"
                    }
                    onChange={(event) => update(key, event.target.value)}
                    className="mt-2 w-full rounded-lg border border-ink/40 bg-white p-3"
                  />
                )}
                {limits[key] && (
                  <p className="mt-1 text-sm">
                    {value.length}/{limits[key]}
                  </p>
                )}
                {errors[key] && (
                  <p className="mt-1 text-sm text-red-800">{errors[key]}</p>
                )}
              </div>
            );
          })}
          <div>
            <label htmlFor="photo" className="block font-medium">
              Photo (optional)
            </label>
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void choosePhoto(event.target.files?.[0])}
              className="mt-2 block w-full"
            />
            <p className="mt-1 text-sm">
              Photo stays on this device during preview.
            </p>
          </div>
          {template.type === "invitation" && (
            <div className="rounded-xl border border-ink/30 p-4">
              <label htmlFor="contact-method" className="block font-medium">
                How guests can reply
              </label>
              <select
                id="contact-method"
                value={contactMethod}
                onChange={(event) =>
                  setContactMethod(event.target.value as ContactMethod)
                }
                className="mt-2 w-full rounded-lg border p-3"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
              <label htmlFor="contact-value" className="mt-4 block font-medium">
                Your{" "}
                {contactMethod === "email" ? "email address" : "phone number"}
              </label>
              <input
                id="contact-value"
                value={contactValue}
                onChange={(event) => setContactValue(event.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
              <p className="mt-2 text-sm">
                Guests with your link will see this contact information.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
