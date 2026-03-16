import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';

export function getMessageRole(message: BaseMessage): string {
  if (message instanceof HumanMessage) return 'human';
  if (message instanceof AIMessage) return 'ai';
  if (message instanceof SystemMessage) return 'system';
  return 'unknown';
}
