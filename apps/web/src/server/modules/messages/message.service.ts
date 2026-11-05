import { MESSAGE_MAX_CHARS, type GeneratedMessages } from "@greetings/shared";
import { createHash } from "node:crypto";
import {
  createAnthropicClient,
  type LlmClient,
} from "../../integrations/llm.client";
import { llmSettings } from "../../lib/config";
import { rateLimit } from "../../lib/rate-limit";
import { messageRepository } from "./message.repository";
import type { MessageInput } from "./message.schema";

const unsafe =
  /(?:https?:\/\/|www\.|<\/?[a-z]|ignore\s+(?:all\s+)?(?:previous|prior)|\b(?:suicide|murder|rape|porn|nazi|fuck|shit|bitch)\b)/i;
const relevant =
  /\b(?:thank\w*|grat\w*|turkey|pie|gather\w*|feast|join\w*|invit\w*|celebrat\w*|warm\w*|wish\w*|table|company|heart|home)\b/i;

function clean(value: string) {
  const result = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return result.length > 0 &&
    result.length <= MESSAGE_MAX_CHARS &&
    !unsafe.test(result)
    ? result
    : null;
}

function fit(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= MESSAGE_MAX_CHARS) return compact;
  const clipped = compact.slice(0, MESSAGE_MAX_CHARS - 1);
  const boundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, Math.max(1, boundary))}…`;
}

function fragment(value: string | undefined) {
  if (!value) return null;
  const result = clean(value);
  return result && result.length <= 120 ? result : null;
}

function curated(input: MessageInput) {
  const recipientName = fragment(input.recipientName);
  const senderName = fragment(input.senderName);
  const recipient = recipientName ? `${recipientName}, ` : "";
  const sender = senderName ? ` — ${senderName}` : "";
  const favourite = input.spelling === "uk" ? "favourite" : "favorite";
  if (input.type === "card") {
    const variants = {
      warm: [
        `${recipient}wishing you a Thanksgiving filled with warmth, gratitude, and your ${favourite} people.${sender}`,
        `${recipient}may your Thanksgiving bring a full heart, a happy home, and beautiful moments to remember.${sender}`,
        `${recipient}sending warm Thanksgiving wishes and so much gratitude for having you in my life.${sender}`,
      ],
      funny: [
        `${recipient}may your turkey be juicy, your pie be plentiful, and your waistband wonderfully forgiving. Happy Thanksgiving!${sender}`,
        `${recipient}wishing you seconds, thirds, and absolutely no awkward questions at Thanksgiving dinner.${sender}`,
        `${recipient}here's to gratitude, great company, and pretending the last slice of pie is up for debate.${sender}`,
      ],
      formal: [
        `${recipient}please accept my warmest wishes for a peaceful and joyful Thanksgiving.${sender}`,
        `${recipient}wishing you and those close to you a meaningful Thanksgiving filled with gratitude.${sender}`,
        `${recipient}may this Thanksgiving bring happiness, reflection, and many reasons to be thankful.${sender}`,
      ],
      "short-sweet": [
        `${recipient}happy Thanksgiving, with warmest wishes.${sender}`,
        `${recipient}grateful for you today and always.${sender}`,
        `${recipient}wishing you a warm and happy Thanksgiving.${sender}`,
      ],
    } as const;
    return variants[input.tone].map(fit);
  }
  const event = fragment(input.eventTitle) || "our Thanksgiving gathering";
  const hostName = fragment(input.hostName);
  const host = hostName ? ` — ${hostName}` : "";
  const variants = {
    warm: [
      `Please join us for ${event}. We would love to share a warm table, grateful hearts, and a wonderful Thanksgiving with you.${host}`,
      `Our Thanksgiving would be brighter with you there. Please join us for ${event} and an evening of food, gratitude, and good company.${host}`,
      `Come gather with us for ${event}. Your company would make our Thanksgiving celebration truly special.${host}`,
    ],
    funny: [
      `Come hungry to ${event}—elastic waistbands are encouraged and leftovers are not guaranteed.${host}`,
      `You are invited to ${event}: good food, great company, and at least one debate over the last slice of pie.${host}`,
      `Join us for ${event}. We will bring the feast; you bring your appetite and best turkey joke.${host}`,
    ],
    formal: [
      `You are cordially invited to ${event}. We would be delighted to celebrate Thanksgiving in your company.${host}`,
      `Please join us for ${event} as we gather in gratitude to mark Thanksgiving together.${host}`,
      `It would be our pleasure to welcome you to ${event} for a thoughtful Thanksgiving celebration.${host}`,
    ],
    "short-sweet": [
      `Join us for ${event}. We would love to celebrate Thanksgiving with you.${host}`,
      `You are invited to ${event}. Come share the warmth of Thanksgiving.${host}`,
      `Save the date for ${event}—we hope you can join us!${host}`,
    ],
  } as const;
  return variants[input.tone].map(fit);
}

type Dependencies = {
  client: () => LlmClient | null;
  limit: typeof rateLimit;
  record: typeof messageRepository.recordUsage;
  now: () => number;
};

export function createMessageService(deps: Dependencies) {
  return {
    async generate(owner: string, ip: string | undefined, input: MessageInput) {
      const hash = (value: string) =>
        createHash("sha256").update(value).digest("hex");
      await deps.limit(`messages:user:${hash(owner)}`, 12);
      if (ip) await deps.limit(`messages:ip:${hash(ip)}`, 30);
      const started = deps.now();
      const client = deps.client();
      let result: Awaited<ReturnType<LlmClient["generate"]>> | null = null;
      try {
        result = client ? await client.generate(input) : null;
      } catch {
        result = null;
      }
      const variants = result?.variants.map(clean);
      const safe =
        variants?.every((item): item is string => item !== null) &&
        new Set(variants).size === 3 &&
        variants.every((item) => relevant.test(item))
          ? variants
          : null;
      const response: GeneratedMessages = safe
        ? { variants: safe, source: "ai" }
        : {
            variants: curated(input),
            source: "curated",
            note: "AI suggestions are temporarily unavailable, so we used our curated message collection.",
          };
      await deps.record({
        ownerClerkId: owner,
        provider: safe ? "anthropic" : "curated",
        model: safe ? result!.model : llmSettings().model,
        inputTokens: safe ? result!.inputTokens : 0,
        outputTokens: safe ? result!.outputTokens : 0,
        elapsedMs: Math.max(0, deps.now() - started),
        outcome: safe ? "generated" : "fallback",
      });
      return response;
    },
  };
}

export const messageService = createMessageService({
  client: createAnthropicClient,
  limit: rateLimit,
  record: messageRepository.recordUsage,
  now: Date.now,
});
