"use client";
import type { ExportQuality } from "@greetings/shared";
export function ExportQualityOptions({
  quality,
  onChange,
  disabled,
}: {
  quality: ExportQuality;
  onChange: (quality: ExportQuality) => void;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="font-medium">Video quality</legend>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="export-quality"
          value="free"
          checked={quality === "free"}
          onChange={() => onChange("free")}
        />
        Free · 720p with watermark
      </label>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="export-quality"
          value="hd"
          checked={quality === "hd"}
          onChange={() => onChange("hd")}
        />
        HD · 1080p, no watermark · 1 credit
      </label>
    </fieldset>
  );
}
