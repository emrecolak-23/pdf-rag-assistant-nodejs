import { get } from 'svelte/store';
import { writable } from '../writeable';
import { api } from '$api';

export interface Message {
	id?: number;
	role: 'user' | 'assistant' | 'system' | 'pending';
	content: string;
}

export interface Conversation {
	id: number;
	messages: Message[];
}

export interface MessageOpts {
	useStreaming?: boolean;
	documentId?: string;
}

export interface ChatState {
	error: string;
	loading: boolean;
	activeConversationId: number | null;
	conversations: Conversation[];
}

const INITIAL_STATE: ChatState = {
	error: '',
	loading: false,
	activeConversationId: null,
	conversations: []
};

const store = writable<ChatState>(INITIAL_STATE);

const set = (val: Partial<ChatState>) => {
	store.update((state) => ({ ...state, ...val }));
};

const getRawMessages = () => {
	const conversation = getActiveConversation();
	if (!conversation) {
		return [];
	}

	return conversation.messages
		.filter((message) => message.role !== 'pending')
		.map((message) => {
			return { role: message.role, content: message.content };
		});
};

const getActiveConversation = () => {
	const { conversations, activeConversationId } = get(store);
	if (!activeConversationId) {
		return null;
	}

	return conversations.find((c) => c.id === activeConversationId);
};

const insertMessageToActive = (message: Message) => {
	store.update((s) => {
		const conv = s.conversations.find((c) => c.id === s.activeConversationId);
		if (!conv) {
			return s;
		}
		const messages = conv.messages ?? [];
		return {
			...s,
			conversations: s.conversations.map((c) =>
				c.id === s.activeConversationId
					? { ...c, messages: [...messages, message] }
					: c
			)
		};
	});
};

const removeMessageFromActive = (id: number) => {
	store.update((s) => {
		const conv = s.conversations.find((c) => c.id === s.activeConversationId);
		if (!conv) {
			return s;
		}
		const messages = (conv.messages ?? []).filter((m) => m.id != id);
		return {
			...s,
			conversations: s.conversations.map((c) =>
				c.id === s.activeConversationId ? { ...c, messages } : c
			)
		};
	});
};

const scoreConversation = async (score: number) => {
	const conversationId = get(store).activeConversationId;

	return api.post(`/scores?conversation_id=${conversationId}`, { score });
};

const fetchConversations = async (documentId: number) => {
	const { data } = await api.get<Conversation[]>(`/conversations?pdf_id=${documentId}`);

	if (data?.length) {
		const conversations: Conversation[] = data.map((c) => ({
			...c,
			messages: c.messages ?? []
		}));
		set({
			conversations,
			activeConversationId: conversations[0].id
		});
	} else {
		await createConversation(documentId);
	}
};

const createConversation = async (documentId: number) => {
	const { data } = await api.post<Conversation>(`/conversations?pdf_id=${documentId}`);

	const conversation: Conversation = {
		...data,
		messages: data.messages ?? []
	};

	set({
		activeConversationId: conversation.id,
		conversations: [conversation, ...get(store).conversations]
	});

	return conversation;
};

const setActiveConversationId = (id: number) => {
	set({ activeConversationId: id });
};

const resetAll = () => {
	set(INITIAL_STATE);
};

const resetError = () => {
	set({ error: '' });
};

export {
	store,
	set,
	setActiveConversationId,
	getRawMessages,
	fetchConversations,
	resetAll,
	resetError,
	createConversation,
	getActiveConversation,
	insertMessageToActive,
	removeMessageFromActive,
	scoreConversation
};
