import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AiConversation {
  id: string;
  title: string;
  messages: AiMessage[];
  createdAt: string;
}

export interface AiState {
  conversations: AiConversation[];
  currentConversationId: string | null;
  isLoading: boolean;
}

const initialState: AiState = {
  conversations: [],
  currentConversationId: null,
  isLoading: false,
};

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    startNewConversation: (state, action: PayloadAction<string>) => {
      const newConv: AiConversation = {
        id: crypto.randomUUID(), // 使用浏览器原生 API 或 nanoid
        title: action.payload,
        messages: [],
        createdAt: new Date().toISOString(),
      };
      state.conversations.push(newConv);
      state.currentConversationId = newConv.id;
    },
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: AiMessage }>) => {
      const conv = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conv) {
        conv.messages.push(action.payload.message);
      }
    },
    setCurrentConversation: (state, action: PayloadAction<string | null>) => {
      state.currentConversationId = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // 预留：清理历史、修改设置等
  },
});

export const {
  startNewConversation, addMessage, setCurrentConversation, setLoading
} = aiSlice.actions;

// Selectors
export const selectAiConversations = (state: RootState) => state.ai.conversations;
export const selectCurrentAiConversation = (state: RootState) => 
  state.ai.conversations.find(c => c.id === state.ai.currentConversationId);
export const selectAiIsLoading = (state: RootState) => state.ai.isLoading;

export default aiSlice;