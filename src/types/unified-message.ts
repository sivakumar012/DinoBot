export type MessageRole = "system" | "user" | "assistant";

export interface UnifiedMessage {
  role: MessageRole;
  content: string;
}
