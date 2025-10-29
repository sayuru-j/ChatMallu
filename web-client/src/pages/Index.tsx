import { useState, useMemo, useRef } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatArea } from "@/components/ChatArea";
import { GroupChatArea } from "@/components/GroupChatArea";
import { CharacterSettings } from "@/components/CharacterSettings";
import { getApiUrls } from "@/config/api";
import { useChatStore } from "@/store/chatStore";

interface Character {
  id: string;
  name: string;
  avatar?: string;
  policy: string;
  lastMessage?: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface Group {
  id: string;
  name: string;
  memberIds: string[]; // character ids
  autoReply: boolean;
  avatar?: string;
  autoParallel?: boolean; // parallel auto-replies (one per member per user send)
  lastMessage?: string; // last message for sidebar preview
}

interface GroupMessage {
  id: string;
  content: string;
  senderId: string | "user"; // character id or 'user'
  timestamp: Date;
}

const Index = () => {
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('chatmallu_characters');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default characters for first-time users
    const defaultCharacters: Character[] = [
      {
        id: 'default-1',
        name: 'Aiden',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        policy: 'You are Aiden, a friendly and helpful AI assistant. You are knowledgeable, patient, and always ready to help with questions or tasks. You communicate in a warm, professional manner and enjoy learning about new topics.',
        lastMessage: ''
      },
      {
        id: 'default-2', 
        name: 'Lyra',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        policy: 'You are Lyra, a creative and imaginative AI companion. You love storytelling, art, and exploring new ideas. You have a playful personality and enjoy engaging in creative conversations. You\'re curious about the world and love to inspire others.',
        lastMessage: ''
      }
    ];
    
    // Save default characters to localStorage
    localStorage.setItem('chatmallu_characters', JSON.stringify(defaultCharacters));
    return defaultCharacters;
  });
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('chatmallu_messages');
    if (!saved) return {};
    try {
      const parsed = JSON.parse(saved) as Record<string, any[]>;
      const converted: Record<string, Message[]> = {};
      for (const key of Object.keys(parsed || {})) {
        converted[key] = (parsed[key] || []).map((m: any) => ({
          ...m,
          timestamp: m?.timestamp ? new Date(m.timestamp) : new Date(),
        }));
      }
      return converted;
    } catch {
      return {};
    }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'characters' | 'groups' | 'chat' | 'api'>('characters');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem('chatmallu_temperature');
    return saved ? parseFloat(saved) : 0.7;
  });
  const [contextLength, setContextLength] = useState(() => {
    const saved = localStorage.getItem('chatmallu_context_length');
    return saved ? parseInt(saved) : 65536; // Increased default context
  });
  const [maxTokens, setMaxTokens] = useState(() => {
    const saved = localStorage.getItem('chatmallu_max_tokens');
    return saved ? parseInt(saved) : 2000;
  });
  const [globalPolicy, setGlobalPolicy] = useState(() => {
    return localStorage.getItem('chatmallu_global_policy') || '';
  });
  const [waitTimePerWord, setWaitTimePerWord] = useState(() => {
    const saved = localStorage.getItem('chatmallu_wait_time_per_word');
    return saved ? parseInt(saved) : 200; // Default 200ms per word
  });
  const [characterMemorySize, setCharacterMemorySize] = useState(() => {
    const saved = localStorage.getItem('chatmallu_character_memory_size');
    return saved ? parseInt(saved) : 20; // Default 20 messages
  });
  const [apiContextSize, setApiContextSize] = useState(() => {
    const saved = localStorage.getItem('chatmallu_api_context_size');
    return saved ? parseInt(saved) : 12; // Default 12 messages
  });
  const [showTypingIndicator, setShowTypingIndicator] = useState(() => {
    const saved = localStorage.getItem('chatmallu_show_typing_indicator');
    return saved ? JSON.parse(saved) : true; // Default to showing typing indicator
  });
  const [suggestedResponses, setSuggestedResponses] = useState<Record<string, string[]>>({});
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});
  const [typingForId, setTypingForId] = useState<string | null>(null);
  const [unread, setUnread] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('chatmallu_unread');
    return saved ? JSON.parse(saved) : {};
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('chatmallu_groups');
    return saved ? JSON.parse(saved) : [];
  });
  const [groupMessages, setGroupMessages] = useState<Record<string, GroupMessage[]>>(() => {
    const saved = localStorage.getItem('chatmallu_group_messages');
    if (!saved) return {};
    try {
      const parsed = JSON.parse(saved) as Record<string, any[]>;
      const converted: Record<string, GroupMessage[]> = {};
      for (const key of Object.keys(parsed || {})) {
        converted[key] = (parsed[key] || []).map((m: any) => ({
          ...m,
          timestamp: m?.timestamp ? new Date(m.timestamp) : new Date(),
        }));
      }
      return converted;
    } catch {
      return {};
    }
  });
  const [unreadGroups, setUnreadGroups] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('chatmallu_unread_groups');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Separate memory per character for group chats (prevents echo loops)
  const [characterMemories, setCharacterMemories] = useState<Record<string, Record<string, any[]>>>(() => {
    const saved = localStorage.getItem('chatmallu_character_memories');
    return saved ? JSON.parse(saved) : {};
  });
  const groupLoopAbortRef = useRef<Record<string, AbortController | null>>({});

  // Utility: simulated thinking delay based on input size
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const computeWaitMs = (text: string) => {
    const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
    const ms = 300 + words * 120; // ~120ms per word
    return Math.max(600, Math.min(3000, ms));
  };
  const computeWaitMsGroup = (text: string) => {
    const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
    const ms = words * waitTimePerWord; // Use configurable wait time per word
    return Math.max(500, Math.min(5000, ms)); // Min 0.5s, max 5s
  };

  // Character memory management (prevents echo loops)
  const getCharacterMemory = (groupId: string, characterId: string) => {
    return characterMemories[groupId]?.[characterId] || [];
  };

  const updateCharacterMemory = (groupId: string, characterId: string, newMessage: any) => {
    setCharacterMemories(prev => {
      const groupMemories = prev[groupId] || {};
      const characterMemory = groupMemories[characterId] || [];
      const updated = {
        ...prev,
        [groupId]: {
          ...groupMemories,
          [characterId]: [...characterMemory.slice(-characterMemorySize), newMessage] // Use configurable memory size
        }
      };
      localStorage.setItem('chatmallu_character_memories', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCharacterMemories = (groupId: string) => {
    setCharacterMemories(prev => {
      const updated = { ...prev };
      delete updated[groupId];
      localStorage.setItem('chatmallu_character_memories', JSON.stringify(updated));
      return updated;
    });
  };

  const selectedCharacter = selectedCharacterId
    ? characters.find((c) => c.id === selectedCharacterId) || null
    : null;

  const selectedGroup = selectedGroupId
    ? groups.find((g) => g.id === selectedGroupId) || null
    : null;

  // Last message map for sidebar
  const lastMessageMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(messages).forEach(([chatId, msgs]) => {
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        map[chatId] = lastMsg.content;
      }
    });
    return map;
  }, [messages]);

  const lastGroupMessageMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(groupMessages).forEach(([chatId, msgs]) => {
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        map[chatId] = lastMsg.content;
      }
    });
    return map;
  }, [groupMessages]);

  // Character management
  const handleCreateCharacter = () => {
    setShowCharacterForm(true);
    setSettingsOpen(true);
    setSettingsTab('characters');
  };

  const handleAddCharacter = (character: Omit<Character, "id">) => {
    const newCharacter: Character = {
      ...character,
      id: Date.now().toString(),
    };
    setCharacters((prev) => {
      const updated = [...prev, newCharacter];
      localStorage.setItem('chatmallu_characters', JSON.stringify(updated));
      return updated;
    });
    setShowCharacterForm(false);
  };

  const handleUpdateCharacter = (id: string, character: Partial<Character>) => {
    setCharacters((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...character } : c));
      localStorage.setItem('chatmallu_characters', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteCharacter = (id: string) => {
    setCharacters((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem('chatmallu_characters', JSON.stringify(updated));
      return updated;
    });
    // Clear messages for deleted character
    setMessages((prev) => {
      const updated = { ...prev };
      delete updated[id];
      localStorage.setItem('chatmallu_messages', JSON.stringify(updated));
      return updated;
    });
  };

  // Group management
  const handleAddGroup = (group: Omit<Group, "id">) => {
    const newGroup: Group = {
      ...group,
      id: Date.now().toString(),
    };
    setGroups((prev) => {
      const updated = [...prev, newGroup];
      localStorage.setItem('chatmallu_groups', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateGroup = (id: string, group: Partial<Group>) => {
    setGroups((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, ...group } : g));
      localStorage.setItem('chatmallu_groups', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteGroup = (id: string) => {
    setGroups((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      localStorage.setItem('chatmallu_groups', JSON.stringify(updated));
      return updated;
    });
    // Clear messages and memories for deleted group
    setGroupMessages((prev) => {
      const updated = { ...prev };
      delete updated[id];
      localStorage.setItem('chatmallu_group_messages', JSON.stringify(updated));
      return updated;
    });
    clearCharacterMemories(id);
  };

  // Chat functions
  const handleSendMessage = async (content: string) => {
    if (!selectedCharacterId) return;

    const chatId = selectedCharacterId;
    const character = characters.find((c) => c.id === selectedCharacterId);
    if (!character) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = { ...prev, [chatId]: [...(prev[chatId] || []), userMsg] };
      localStorage.setItem('chatmallu_messages', JSON.stringify(updated));
      return updated;
    });

    // Add thinking delay
    const words = content.split(/\s+/).filter(Boolean).length;
    const delay = Math.min(3000, Math.max(600, words * 120)); // 120ms per word, min 0.6s, max 3s
    await sleep(delay);

    setTypingForId(selectedCharacterId);

    try {
      const apiUrls = getApiUrls();
      const response = await fetch(apiUrls.CHAT_STREAM, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          character_name: character.name,
          character_policy: ((globalPolicy ? globalPolicy + "\n" : "") + character.policy),
          message: content,
          conversation_history: (messages[chatId] || []).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature,
            max_tokens: maxTokens,
          context_length: contextLength,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.error) throw new Error(data.error);
              if (data.content) full += data.content;
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: full,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = { ...prev, [chatId]: [...(prev[chatId] || []), assistantMsg] };
        localStorage.setItem('chatmallu_messages', JSON.stringify(updated));
        return updated;
      });

      // Update character's last message
      handleUpdateCharacter(selectedCharacterId, { lastMessage: full });

      // Clear unread if this is the active chat
      if (selectedCharacterId === chatId) {
        setUnread((prev) => {
          if (!prev[chatId]) return prev;
          const next = { ...prev };
          delete next[chatId];
          localStorage.setItem('chatmallu_unread', JSON.stringify(next));
          return next;
        });
      }

      // Generate suggestions after character responds
      setTimeout(() => {
        generateIndividualSuggestions(chatId, messages[chatId] || []);
      }, 1000);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setTypingForId(null);
    }
  };

  // Group chat send with separate character memories (prevents echo loops)
  const handleSendGroupMessage = async (content: string) => {
    if (!selectedGroupId) return;
    const group = groups.find((g) => g.id === selectedGroupId);
    if (!group) return;

    const chatId = selectedGroupId;

    // Add user message to group messages
    const userMsg: GroupMessage = {
      id: Date.now().toString(),
      content,
      senderId: 'user',
      timestamp: new Date(),
    };
    setGroupMessages((prev) => {
      const updated = { ...prev, [chatId]: [...(prev[chatId] || []), userMsg] };
      localStorage.setItem('chatmallu_group_messages', JSON.stringify(updated));
      return updated;
    });

    if (!group.autoReply || group.memberIds.length === 0) return;

    // Cancel any ongoing group loop for this chat
    try { groupLoopAbortRef.current[chatId]?.abort(); } catch {}
    const loopController = new AbortController();
    groupLoopAbortRef.current[chatId] = loopController;

    try {
      setTypingForId(chatId);
      const apiUrls = getApiUrls();

      const sanitize = (text: string) => {
        if (!text) return "";
        let s = text.replace(/^["'""`]+|["'""`]+$/g, "");
        s = s.replace(/^\s*([A-Za-z][A-Za-z0-9_ -]{0,30})\s*:\s*/i, "");
        s = s.replace(/^(?:\s*[A-Za-z][A-Za-z0-9_ -]{0,30}\s*:?\s*\n){1,}/i, "");
        return s.trim();
      };

      // Add user message to all character memories
      const userMessageForMemory = { role: 'user', content: sanitize(content) };
      group.memberIds.forEach(characterId => {
        updateCharacterMemory(chatId, characterId, userMessageForMemory);
      });

      if (group.autoParallel) {
        // Parallel mode: all characters reply to user message simultaneously
        const tasks = group.memberIds.map(async (responderId, idx) => {
          if (loopController.signal.aborted) return;
          const responder = characters.find((c) => c.id === responderId);
          if (!responder) return;

          // Get this character's separate memory
          const characterMemory = getCharacterMemory(chatId, responderId);
          
          // Add thinking delay with jitter
          const jitter = Math.min(600, idx * 150);
          await sleep(computeWaitMsGroup(content) + jitter);
          if (loopController.signal.aborted) return;

          const resp = await fetch(apiUrls.CHAT_STREAM, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              character_name: responder.name,
              character_policy: ((globalPolicy ? globalPolicy + "\n" : "") + responder.policy + `\nYou are ${responder.name}. Pay attention to the conversation context and respond naturally. Keep responses concise (1-2 lines) but meaningful. Don't repeat what others have said. If the conversation is about a specific topic, engage with that topic.`),
              message: sanitize(content),
              conversation_history: characterMemory.slice(-apiContextSize), // Use configurable API context size
              temperature,
              max_tokens: 256,
              context_length: 12288,
              stop: [], // No stop list needed with separate memories
            }),
            signal: loopController.signal,
          });
          if (!resp.ok) return;
          
          const reader = resp.body?.getReader();
          if (!reader) return;
          const decoder = new TextDecoder();
          let full = '';
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try { const d = JSON.parse(line.substring(6)); if (d.content) full += d.content; } catch {}
              }
            }
          }

          const reply: GroupMessage = { 
            id: (Date.now() + idx).toString(), 
            content: sanitize(full), 
            senderId: responderId, 
            timestamp: new Date() 
          };
          
          // Add to group messages
          setGroupMessages((prev) => {
            const updated = { ...prev, [chatId]: [...(prev[chatId] || []), reply] };
            localStorage.setItem('chatmallu_group_messages', JSON.stringify(updated));
            return updated;
          });

          // Add to this character's memory
          updateCharacterMemory(chatId, responderId, { role: 'assistant', content: sanitize(full) });

          // Add to other characters' memories (they can see each other's replies)
          group.memberIds.forEach(otherId => {
            if (otherId !== responderId) {
              updateCharacterMemory(chatId, otherId, { role: 'user', content: `${responder.name}: ${sanitize(full)}` });
            }
          });

          if (selectedGroupId !== chatId) {
            setUnreadGroups((prev) => {
              const next = { ...prev, [chatId]: (prev[chatId] || 0) + 1 };
              localStorage.setItem('chatmallu_unread_groups', JSON.stringify(next));
              return next;
            });
          }
        });
        await Promise.allSettled(tasks);
        
        // Generate suggestions after parallel replies
        setTimeout(() => {
          generateSuggestedResponses(chatId, groupMessages[chatId] || []);
        }, 1000);
      } else {
        // Sequential mode: characters take turns
        const iterations = 8; // Reduced iterations
        let currentMessage = content;
        
        outer: for (let iter = 0; iter < iterations; iter++) {
          for (let r = 0; r < group.memberIds.length; r++) {
            if (loopController.signal.aborted) break outer;
            const responderId = group.memberIds[r];
            const responder = characters.find((c) => c.id === responderId);
            if (!responder) continue;

            // Get this character's separate memory
            const characterMemory = getCharacterMemory(chatId, responderId);
            
            // Add thinking delay based on the message they're responding to
            await sleep(computeWaitMsGroup(currentMessage));
            if (loopController.signal.aborted) break outer;

            const resp = await fetch(apiUrls.CHAT_STREAM, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                character_name: responder.name,
                character_policy: ((globalPolicy ? globalPolicy + "\n" : "") + responder.policy + `\nYou are ${responder.name}. Pay attention to the conversation context and respond naturally. Keep responses concise (1-2 lines) but meaningful. Continue the conversation naturally based on what's being discussed.`),
                message: sanitize(currentMessage),
                conversation_history: characterMemory.slice(-apiContextSize), // Use configurable API context size
                temperature,
                max_tokens: 256,
                context_length: 12288,
                stop: [],
              }),
              signal: loopController.signal,
            });
            if (!resp.ok) continue;
            
            const reader = resp.body?.getReader();
            if (!reader) continue;
            const decoder = new TextDecoder();
            let full = '';
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try { const d = JSON.parse(line.substring(6)); if (d.content) full += d.content; } catch {}
                }
              }
            }

            const reply: GroupMessage = {
              id: (Date.now() + (iter * group.memberIds.length) + r).toString(),
              content: sanitize(full),
              senderId: responderId,
              timestamp: new Date(),
            };
            
            // Add to group messages
            setGroupMessages((prev) => {
              const updated = { ...prev, [chatId]: [...(prev[chatId] || []), reply] };
              localStorage.setItem('chatmallu_group_messages', JSON.stringify(updated));
              return updated;
            });

            // Add to this character's memory
            updateCharacterMemory(chatId, responderId, { role: 'assistant', content: sanitize(full) });

            // Add to other characters' memories
            group.memberIds.forEach(otherId => {
              if (otherId !== responderId) {
                updateCharacterMemory(chatId, otherId, { role: 'user', content: `${responder.name}: ${sanitize(full)}` });
              }
            });

            // Next character responds to this reply
            currentMessage = sanitize(full);

            if (selectedGroupId !== chatId) {
              setUnreadGroups((prev) => {
                const next = { ...prev, [chatId]: (prev[chatId] || 0) + 1 };
                localStorage.setItem('chatmallu_unread_groups', JSON.stringify(next));
                return next;
              });
            }
          }
        }
        
        // Generate suggestions after sequential replies
        setTimeout(() => {
          generateSuggestedResponses(chatId, groupMessages[chatId] || []);
        }, 1000);
      }
    } catch (error) {
      console.error('Group chat error:', error);
    } finally {
      setTypingForId(null);
      if (groupLoopAbortRef.current[chatId] === loopController) {
        groupLoopAbortRef.current[chatId] = null;
      }
    }
  };

  // Clear history functions
  const handleClearHistory = (chatId: string) => {
    setMessages((prev) => {
      const updated = { ...prev };
      delete updated[chatId];
      localStorage.setItem('chatmallu_messages', JSON.stringify(updated));
      return updated;
    });
    
    // Clear suggestions for this chat
    setSuggestedResponses(prev => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });
    setShowSuggestions(prev => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });

    // Clear last message for this character
    handleUpdateCharacter(chatId, { lastMessage: "" });
  };

  const handleClearGroupHistory = (groupId: string) => {
    setGroupMessages((prev) => {
      const updated = { ...prev };
      delete updated[groupId];
      localStorage.setItem('chatmallu_group_messages', JSON.stringify(updated));
      return updated;
    });
    clearCharacterMemories(groupId);
    
    // Clear suggestions for this group
    setSuggestedResponses(prev => {
      const updated = { ...prev };
      delete updated[groupId];
      return updated;
    });
    setShowSuggestions(prev => {
      const updated = { ...prev };
      delete updated[groupId];
      return updated;
    });

    // Clear last message for this group
    handleUpdateGroup(groupId, { lastMessage: "" });
  };

  // Group settings
  const handleToggleAutoReply = (groupId: string) => {
    handleUpdateGroup(groupId, { autoReply: !groups.find(g => g.id === groupId)?.autoReply });
  };

  const handleToggleParallel = (groupId: string) => {
    handleUpdateGroup(groupId, { autoParallel: !groups.find(g => g.id === groupId)?.autoParallel });
  };

  const handleWaitTimeChange = (value: number) => {
    setWaitTimePerWord(value);
    localStorage.setItem('chatmallu_wait_time_per_word', value.toString());
  };

  const handleCharacterMemorySizeChange = (value: number) => {
    setCharacterMemorySize(value);
    localStorage.setItem('chatmallu_character_memory_size', value.toString());
  };

  const handleApiContextSizeChange = (value: number) => {
    setApiContextSize(value);
    localStorage.setItem('chatmallu_api_context_size', value.toString());
  };

  const handleTypingIndicatorToggle = (enabled: boolean) => {
    setShowTypingIndicator(enabled);
    localStorage.setItem('chatmallu_show_typing_indicator', JSON.stringify(enabled));
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    if (selectedGroupId) {
      handleSendGroupMessage(suggestion);
      // Clear suggestions for this group
      setShowSuggestions(prev => ({ ...prev, [selectedGroupId]: false }));
      setSuggestedResponses(prev => ({ ...prev, [selectedGroupId]: [] }));
    } else if (selectedCharacterId) {
      handleSendMessage(suggestion);
      // Clear suggestions for this character
      setShowSuggestions(prev => ({ ...prev, [selectedCharacterId]: false }));
      setSuggestedResponses(prev => ({ ...prev, [selectedCharacterId]: [] }));
    }
  };

  // Hide suggestions when user starts typing
  const handleInputChange = (value: string) => {
    if (value.trim()) {
      if (selectedGroupId && showSuggestions[selectedGroupId]) {
        setShowSuggestions(prev => ({ ...prev, [selectedGroupId]: false }));
        setSuggestedResponses(prev => ({ ...prev, [selectedGroupId]: [] }));
      } else if (selectedCharacterId && showSuggestions[selectedCharacterId]) {
        setShowSuggestions(prev => ({ ...prev, [selectedCharacterId]: false }));
        setSuggestedResponses(prev => ({ ...prev, [selectedCharacterId]: [] }));
      }
    }
  };

  // Generate suggested responses for individual chats
  const generateIndividualSuggestions = async (characterId: string, recentMessages: Message[]) => {
    if (recentMessages.length === 0) return;

    try {
      const apiUrls = getApiUrls();
      const character = characters.find(c => c.id === characterId);
      if (!character) return;

      const context = recentMessages.slice(-5).map(m => 
        m.role === 'user' ? `User: ${m.content}` : `${character.name}: ${m.content}`
      ).join('\n');

      const response = await fetch(apiUrls.CHAT_STREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: 'ResponseGenerator',
          character_policy: `You are a response suggestion generator. Based on the conversation with ${character.name}, suggest 3 different response options for the user:

1. A neutral/acknowledging response
2. A contextual response that engages with the current topic
3. A response that changes the context/topic

Keep each suggestion concise (1-2 lines max). Make them natural and conversational. Do not use quotes around the suggestions.`,
          message: `Recent conversation with ${character.name}:\n${context}\n\nGenerate 3 response suggestions for the user.`,
          conversation_history: [],
          temperature: 0.8,
          max_tokens: 200,
          context_length: 4096,
        }),
      });

      if (!response.ok) return;

      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let full = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try { const d = JSON.parse(line.substring(6)); if (d.content) full += d.content; } catch {}
          }
        }
      }

      const suggestions = full.split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^["']|["']$/g, '').trim()) // Remove leading/trailing quotes
        .filter(line => line.length > 0)
        .slice(0, 3);

      if (suggestions.length >= 3) {
        setSuggestedResponses(prev => ({ ...prev, [characterId]: suggestions }));
        setShowSuggestions(prev => ({ ...prev, [characterId]: true }));
      }
    } catch (error) {
      console.error('Error generating individual suggestions:', error);
    }
  };

  // Generate suggested responses for group chats
  const generateSuggestedResponses = async (groupId: string, recentMessages: GroupMessage[]) => {
    if (recentMessages.length === 0) return;

    try {
      const apiUrls = getApiUrls();
      const lastMessage = recentMessages[recentMessages.length - 1];
      const context = recentMessages.slice(-5).map(m => 
        m.senderId === 'user' ? `User: ${m.content}` : `${characters.find(c => c.id === m.senderId)?.name || 'Someone'}: ${m.content}`
      ).join('\n');

      const response = await fetch(apiUrls.CHAT_STREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: 'ResponseGenerator',
          character_policy: `You are a response suggestion generator. Based on the conversation context, suggest 3 different response options for the user:

1. A neutral/acknowledging response
2. A contextual response that engages with the current topic
3. A response that changes the context/topic

Keep each suggestion concise (1-2 lines max). Make them natural and conversational. Do not use quotes around the suggestions.`,
          message: `Recent conversation:\n${context}\n\nGenerate 3 response suggestions for the user.`,
          conversation_history: [],
          temperature: 0.8,
          max_tokens: 200,
          context_length: 4096,
        }),
      });

      if (!response.ok) return;

      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let full = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try { const d = JSON.parse(line.substring(6)); if (d.content) full += d.content; } catch {}
          }
        }
      }

      // Parse the response to extract 3 suggestions
      const suggestions = full.split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^["']|["']$/g, '').trim()) // Remove leading/trailing quotes
        .filter(line => line.length > 0)
        .slice(0, 3);

      if (suggestions.length >= 3) {
        setSuggestedResponses(prev => ({ ...prev, [groupId]: suggestions }));
        setShowSuggestions(prev => ({ ...prev, [groupId]: true }));
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  // Generate chat summary for individual chats
  const generateChatSummary = async (characterId: string, messages: Message[]) => {
    if (messages.length === 0) return "No conversation yet.";

    try {
      const apiUrls = getApiUrls();
      const character = characters.find(c => c.id === characterId);
      if (!character) return "Character not found.";

      const context = messages.slice(-10).map(m => 
        m.role === 'user' ? `User: ${m.content}` : `${character.name}: ${m.content}`
      ).join('\n');

      const response = await fetch(apiUrls.CHAT_STREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: 'ChatSummarizer',
          character_policy: `You are a chat summarizer. Create a concise summary of the conversation between the user and ${character.name}. Focus on:
- Main topics discussed
- Key decisions or conclusions
- Important context or background
- Current status or next steps

Keep it brief (2-3 sentences max) and conversational.`,
          message: `Conversation with ${character.name}:\n${context}\n\nProvide a brief summary of what happened in this chat.`,
          conversation_history: [],
          temperature: 0.7,
          max_tokens: 150,
          context_length: 4096,
        }),
      });

      if (!response.ok) return "Unable to generate summary.";

      const reader = response.body?.getReader();
      if (!reader) return "Unable to generate summary.";
      const decoder = new TextDecoder();
      let full = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try { const d = JSON.parse(line.substring(6)); if (d.content) full += d.content; } catch {}
          }
        }
      }

      return full.trim() || "Unable to generate summary.";
    } catch (error) {
      console.error('Error generating chat summary:', error);
      return "Unable to generate summary.";
    }
  };

  // Generate chat summary for group chats
  const generateGroupChatSummary = async (groupId: string, messages: GroupMessage[]) => {
    if (messages.length === 0) return "No conversation yet.";

    try {
      const apiUrls = getApiUrls();
      const group = groups.find(g => g.id === groupId);
      if (!group) return "Group not found.";

      const context = messages.slice(-15).map(m => 
        m.senderId === 'user' ? `User: ${m.content}` : `${characters.find(c => c.id === m.senderId)?.name || 'Someone'}: ${m.content}`
      ).join('\n');

      const response = await fetch(apiUrls.CHAT_STREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: 'GroupChatSummarizer',
          character_policy: `You are a group chat summarizer. Create a concise summary of the group conversation. Focus on:
- Main topics discussed
- Key participants and their contributions
- Important decisions or conclusions
- Current status or next steps

Keep it brief (2-3 sentences max) and conversational.`,
          message: `Group conversation in ${group.name}:\n${context}\n\nProvide a brief summary of what happened in this group chat.`,
          conversation_history: [],
          temperature: 0.7,
          max_tokens: 150,
          context_length: 4096,
        }),
      });

      if (!response.ok) return "Unable to generate summary.";

      const reader = response.body?.getReader();
      if (!reader) return "Unable to generate summary.";
      const decoder = new TextDecoder();
      let full = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try { const d = JSON.parse(line.substring(6)); if (d.content) full += d.content; } catch {}
          }
        }
      }

      return full.trim() || "Unable to generate summary.";
    } catch (error) {
      console.error('Error generating group chat summary:', error);
      return "Unable to generate summary.";
    }
  };

  return (
    <div className="flex h-app md:h-screen overflow-hidden bg-wa-bg max-w-full">
      <div
        className={`${
          selectedCharacterId || selectedGroupId ? "hidden md:flex" : "flex"
        } w-full md:w-auto max-w-full`}
      >
        <ChatSidebar
          characters={characters}
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={(id) => {
            setSelectedCharacterId(id);
            setSelectedGroupId(null);
            // clear unread on open
            setUnread((prev) => {
              if (!prev[id]) return prev;
              const next = { ...prev };
              delete next[id];
              localStorage.setItem('chatmallu_unread', JSON.stringify(next));
              return next;
            });
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          onCreateCharacter={handleCreateCharacter}
          lastMessageMap={lastMessageMap}
          unreadMap={unread}
          messages={messages}
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={(id) => {
            setSelectedGroupId(id);
            setSelectedCharacterId(null);
            // clear unread on open
            setUnreadGroups((prev) => {
              if (!prev[id]) return prev;
              const next = { ...prev };
              delete next[id];
              localStorage.setItem('chatmallu_unread_groups', JSON.stringify(next));
              return next;
            });
          }}
          lastGroupMessageMap={lastGroupMessageMap}
          unreadGroupMap={unreadGroups}
          onDeleteGroup={handleDeleteGroup}
          groupMessages={groupMessages}
        />
      </div>

      {selectedCharacterId && (
        <ChatArea
          character={selectedCharacter}
          messages={messages[selectedCharacterId] || []}
          onSendMessage={handleSendMessage}
          onBack={() => setSelectedCharacterId(null)}
          isTyping={typingForId === selectedCharacterId}
          onClearHistory={() => handleClearHistory(selectedCharacterId)}
          suggestedResponses={suggestedResponses[selectedCharacterId] || []}
          showSuggestions={showSuggestions[selectedCharacterId] || false}
          onSuggestionClick={handleSuggestionClick}
          onGenerateSummary={() => generateChatSummary(selectedCharacterId, messages[selectedCharacterId] || [])}
          showTypingIndicator={showTypingIndicator}
        />
      )}

       {selectedGroupId && (
         <GroupChatArea
           groupName={selectedGroup?.name || ""}
           groupAvatar={selectedGroup?.avatar}
           members={selectedGroup?.memberIds.map(id => {
             const char = characters.find(c => c.id === id);
             return { id, name: char?.name || "", avatar: char?.avatar };
           }) || []}
           messages={groupMessages[selectedGroupId] || []}
           onSend={handleSendGroupMessage}
           onBack={() => setSelectedGroupId(null)}
           isTyping={typingForId === selectedGroupId}
           onClearHistory={() => handleClearGroupHistory(selectedGroupId)}
           autoReplyEnabled={selectedGroup?.autoReply || false}
           onToggleAutoReply={() => handleToggleAutoReply(selectedGroupId)}
           autoParallelEnabled={selectedGroup?.autoParallel || false}
           onToggleParallel={() => handleToggleParallel(selectedGroupId)}
           waitTimePerWord={waitTimePerWord}
           onWaitTimeChange={handleWaitTimeChange}
           characterMemorySize={characterMemorySize}
           onCharacterMemorySizeChange={handleCharacterMemorySizeChange}
           apiContextSize={apiContextSize}
           onApiContextSizeChange={handleApiContextSizeChange}
           suggestedResponses={suggestedResponses[selectedGroupId] || []}
           showSuggestions={showSuggestions[selectedGroupId] || false}
           onSuggestionClick={handleSuggestionClick}
           onGenerateSummary={() => generateGroupChatSummary(selectedGroupId, groupMessages[selectedGroupId] || [])}
           showTypingIndicator={showTypingIndicator}
         />
       )}

      <CharacterSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        characters={characters}
        onAddCharacter={handleAddCharacter}
        onUpdateCharacter={handleUpdateCharacter}
        onDeleteCharacter={handleDeleteCharacter}
        temperature={temperature}
        onTemperatureChange={setTemperature}
        contextLength={contextLength}
        onContextLengthChange={setContextLength}
        maxTokens={maxTokens}
        onMaxTokensChange={setMaxTokens}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
        groups={groups}
        onAddGroup={handleAddGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onEditGroup={(group) => {
          // Handle group editing
        }}
        showGroupForm={showGroupForm}
        onShowGroupForm={setShowGroupForm}
        globalPolicy={globalPolicy}
        onGlobalPolicyChange={setGlobalPolicy}
        showTypingIndicator={showTypingIndicator}
        onTypingIndicatorToggle={handleTypingIndicatorToggle}
      />
    </div>
  );
};

export default Index;
