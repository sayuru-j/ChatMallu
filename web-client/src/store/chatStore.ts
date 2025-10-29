import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Character {
  id: string;
  name: string;
  avatar?: string;
  policy: string;
  lastMessage?: string;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  autoReply: boolean;
  avatar?: string;
  autoParallel?: boolean;
  lastMessage?: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export interface GroupMessage {
  id: string;
  content: string;
  senderId: string | "user";
  timestamp: Date;
}

export interface CharacterMemory {
  [groupId: string]: {
    [characterId: string]: any[];
  };
}

interface ChatStore {
  // Characters
  characters: Character[];
  selectedCharacterId: string | null;
  
  // Groups
  groups: Group[];
  selectedGroupId: string | null;
  
  // Messages
  messages: Record<string, Message[]>;
  groupMessages: Record<string, GroupMessage[]>;
  
  // Character memories for groups
  characterMemories: CharacterMemory;
  
  // Suggestions
  suggestedResponses: Record<string, string[]>;
  showSuggestions: Record<string, boolean>;
  
  // UI State
  typingForId: string | null;
  unread: Record<string, number>;
  unreadGroups: Record<string, number>;
  
  // Settings
  temperature: number;
  contextLength: number;
  maxTokens: number;
  globalPolicy: string;
  waitTimePerWord: number;
  characterMemorySize: number;
  apiContextSize: number;
  
  // Actions
  setSelectedCharacter: (id: string | null) => void;
  setSelectedGroup: (id: string | null) => void;
  
  addCharacter: (character: Omit<Character, "id">) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  
  addGroup: (group: Omit<Group, "id">) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  
  addMessage: (chatId: string, message: Message) => void;
  addGroupMessage: (groupId: string, message: GroupMessage) => void;
  clearMessages: (chatId: string) => void;
  clearGroupMessages: (groupId: string) => void;
  
  updateCharacterMemory: (groupId: string, characterId: string, message: any) => void;
  clearCharacterMemories: (groupId: string) => void;
  getCharacterMemory: (groupId: string, characterId: string) => any[];
  
  setSuggestions: (chatId: string, suggestions: string[]) => void;
  clearSuggestions: (chatId: string) => void;
  setShowSuggestions: (chatId: string, show: boolean) => void;
  
  setTyping: (id: string | null) => void;
  setUnread: (chatId: string, count: number) => void;
  setUnreadGroup: (groupId: string, count: number) => void;
  clearUnread: (chatId: string) => void;
  clearUnreadGroup: (groupId: string) => void;
  
  updateSettings: (settings: Partial<{
    temperature: number;
    contextLength: number;
    maxTokens: number;
    globalPolicy: string;
    waitTimePerWord: number;
    characterMemorySize: number;
    apiContextSize: number;
  }>) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      characters: [],
      selectedCharacterId: null,
      groups: [],
      selectedGroupId: null,
      messages: {},
      groupMessages: {},
      characterMemories: {},
      suggestedResponses: {},
      showSuggestions: {},
      typingForId: null,
      unread: {},
      unreadGroups: {},
      temperature: 0.7,
      contextLength: 65536,
      maxTokens: 2000,
      globalPolicy: '',
      waitTimePerWord: 200,
      characterMemorySize: 20,
      apiContextSize: 12,

      // Character actions
      setSelectedCharacter: (id) => set({ selectedCharacterId: id }),
      setSelectedGroup: (id) => set({ selectedGroupId: id }),

      addCharacter: (character) => {
        const newCharacter: Character = {
          ...character,
          id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          characters: [...state.characters, newCharacter],
        }));
      },

      updateCharacter: (id, updates) => {
        set((state) => ({
          characters: state.characters.map((char) =>
            char.id === id ? { ...char, ...updates } : char
          ),
        }));
      },

      deleteCharacter: (id) => {
        set((state) => ({
          characters: state.characters.filter((char) => char.id !== id),
          messages: Object.fromEntries(
            Object.entries(state.messages).filter(([key]) => key !== id)
          ),
          suggestedResponses: Object.fromEntries(
            Object.entries(state.suggestedResponses).filter(([key]) => key !== id)
          ),
          showSuggestions: Object.fromEntries(
            Object.entries(state.showSuggestions).filter(([key]) => key !== id)
          ),
        }));
      },

      // Group actions
      addGroup: (group) => {
        const newGroup: Group = {
          ...group,
          id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          groups: [...state.groups, newGroup],
        }));
      },

      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, ...updates } : group
          ),
        }));
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          groupMessages: Object.fromEntries(
            Object.entries(state.groupMessages).filter(([key]) => key !== id)
          ),
          suggestedResponses: Object.fromEntries(
            Object.entries(state.suggestedResponses).filter(([key]) => key !== id)
          ),
          showSuggestions: Object.fromEntries(
            Object.entries(state.showSuggestions).filter(([key]) => key !== id)
          ),
          characterMemories: Object.fromEntries(
            Object.entries(state.characterMemories).filter(([key]) => key !== id)
          ),
        }));
      },

      // Message actions
      addMessage: (chatId, message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message],
          },
        }));
      },

      addGroupMessage: (groupId, message) => {
        set((state) => ({
          groupMessages: {
            ...state.groupMessages,
            [groupId]: [...(state.groupMessages[groupId] || []), message],
          },
        }));
      },

      clearMessages: (chatId) => {
        set((state) => {
          const newMessages = { ...state.messages };
          delete newMessages[chatId];
          return { messages: newMessages };
        });
      },

      clearGroupMessages: (groupId) => {
        set((state) => {
          const newGroupMessages = { ...state.groupMessages };
          delete newGroupMessages[groupId];
          return { groupMessages: newGroupMessages };
        });
      },

      // Character memory actions
      updateCharacterMemory: (groupId, characterId, message) => {
        set((state) => {
          const groupMemories = state.characterMemories[groupId] || {};
          const characterMemory = groupMemories[characterId] || [];
          const newMemory = [...characterMemory.slice(-state.characterMemorySize), message];
          
          return {
            characterMemories: {
              ...state.characterMemories,
              [groupId]: {
                ...groupMemories,
                [characterId]: newMemory,
              },
            },
          };
        });
      },

      clearCharacterMemories: (groupId) => {
        set((state) => {
          const newMemories = { ...state.characterMemories };
          delete newMemories[groupId];
          return { characterMemories: newMemories };
        });
      },

      getCharacterMemory: (groupId, characterId) => {
        return get().characterMemories[groupId]?.[characterId] || [];
      },

      // Suggestion actions
      setSuggestions: (chatId, suggestions) => {
        set((state) => ({
          suggestedResponses: {
            ...state.suggestedResponses,
            [chatId]: suggestions,
          },
          showSuggestions: {
            ...state.showSuggestions,
            [chatId]: true,
          },
        }));
      },

      clearSuggestions: (chatId) => {
        set((state) => {
          const newSuggestions = { ...state.suggestedResponses };
          const newShowSuggestions = { ...state.showSuggestions };
          delete newSuggestions[chatId];
          delete newShowSuggestions[chatId];
          return {
            suggestedResponses: newSuggestions,
            showSuggestions: newShowSuggestions,
          };
        });
      },

      setShowSuggestions: (chatId, show) => {
        set((state) => ({
          showSuggestions: {
            ...state.showSuggestions,
            [chatId]: show,
          },
        }));
      },

      // UI state actions
      setTyping: (id) => set({ typingForId: id }),
      setUnread: (chatId, count) => {
        set((state) => ({
          unread: { ...state.unread, [chatId]: count },
        }));
      },
      setUnreadGroup: (groupId, count) => {
        set((state) => ({
          unreadGroups: { ...state.unreadGroups, [groupId]: count },
        }));
      },
      clearUnread: (chatId) => {
        set((state) => {
          const newUnread = { ...state.unread };
          delete newUnread[chatId];
          return { unread: newUnread };
        });
      },
      clearUnreadGroup: (groupId) => {
        set((state) => {
          const newUnreadGroups = { ...state.unreadGroups };
          delete newUnreadGroups[groupId];
          return { unreadGroups: newUnreadGroups };
        });
      },

      // Settings actions
      updateSettings: (settings) => {
        set((state) => ({ ...state, ...settings }));
      },
    }),
    {
      name: 'chatmallu-store',
      partialize: (state) => ({
        characters: state.characters,
        groups: state.groups,
        messages: state.messages,
        groupMessages: state.groupMessages,
        characterMemories: state.characterMemories,
        temperature: state.temperature,
        contextLength: state.contextLength,
        maxTokens: state.maxTokens,
        globalPolicy: state.globalPolicy,
        waitTimePerWord: state.waitTimePerWord,
        characterMemorySize: state.characterMemorySize,
        apiContextSize: state.apiContextSize,
      }),
    }
  )
);
