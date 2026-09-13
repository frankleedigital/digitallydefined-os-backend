// src/utils/validation.js
import { z } from "zod";

export const dashboardSchema = z.object({
  action: z.literal("dashboard"),
  context: z.object({
    includeNotion: z.boolean().optional(),
  }).optional(),
  userId: z.string().optional(),
});

export const chatSchema = z.object({
  action: z.literal("chat").or(z.literal("public.chat")).or(z.literal("hermes.agent")),
  message: z.string().min(1),
  systemPrompt: z.string().optional(),
  conversation: z.array(z.any()).optional(),
});

export function validateInput(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { valid: false, errors: result.error.errors };
  }
  return { valid: true, data: result.data };
}

export default { dashboardSchema, chatSchema, validateInput };
