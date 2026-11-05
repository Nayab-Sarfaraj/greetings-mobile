import { z } from "zod";
export const renderChoice = z.object({
  quality: z.enum(["free", "hd"]).default("free"),
});
