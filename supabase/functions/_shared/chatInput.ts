/** Caller-supplied history is never a privileged instruction channel. */
export function validChatHistory(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0 || value.length > 60) return false;
  return value.every(message => message && typeof message === "object"
    && (message.role === "user" || message.role === "assistant")
    && typeof message.content === "string" && message.content.length <= 30000
    && (message.images === undefined || (Array.isArray(message.images)
      && message.images.length <= 4 && message.images.every((image: unknown) => typeof image === "string"))));
}