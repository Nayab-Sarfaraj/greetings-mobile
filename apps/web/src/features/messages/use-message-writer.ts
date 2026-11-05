"use client";
import { useMutation } from "@tanstack/react-query";
import type {
  GenerateMessageInput,
  GeneratedMessages,
} from "@greetings/shared";
import { api } from "@/lib/api-client";

export function useMessageWriter() {
  return useMutation({
    mutationFn: (input: GenerateMessageInput) =>
      api<GeneratedMessages>("/api/messages/generate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}
