import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, Phone, Video, MoreVertical, Trash2, ChevronDown, ChevronUp, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface Character {
  id: string;
  name: string;
  avatar?: string;
  policy: string;
}

interface ChatAreaProps {
  character: Character | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onBack: () => void;
  isTyping?: boolean;
  onClearHistory?: () => void;
  suggestedResponses?: string[];
  showSuggestions?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  onGenerateSummary?: () => Promise<string>;
  showTypingIndicator?: boolean;
}

export const ChatArea = ({ 
  character, 
  messages, 
  onSendMessage, 
  onBack,
  isTyping = false,
  onClearHistory,
  suggestedResponses = [],
  showSuggestions = false,
  onSuggestionClick,
  onGenerateSummary,
  showTypingIndicator = true
}: ChatAreaProps) => {
  const [input, setInput] = useState("");
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (ts: Date | string | number): string => {
    const date = ts instanceof Date ? ts : new Date(ts as any);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset collapse state when suggestions are cleared
  useEffect(() => {
    if (!showSuggestions || suggestedResponses.length === 0) {
      setSuggestionsCollapsed(false);
    }
  }, [showSuggestions, suggestedResponses]);

  const handleSend = () => {
    if (input.trim() && character) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle summary generation
  const handleGenerateSummary = async () => {
    if (!onGenerateSummary) return;
    
    setIsGeneratingSummary(true);
    setSummaryOpen(true);
    
    try {
      const summaryText = await onGenerateSummary();
      setSummary(summaryText);
    } catch (error) {
      setSummary("Unable to generate summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (!character) {
    return (
      <div className="flex-1 flex items-center justify-center bg-wa-bg wa-chat-pattern">
        <div className="text-center px-4 sm:px-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-wa-green/10 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl">💬</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-wa-text-primary mb-2 sm:mb-3">
            AI Character Chat
          </h2>
          <p className="text-wa-text-secondary text-xs sm:text-sm max-w-xs sm:max-w-sm mx-auto px-2">
            Select a character from the sidebar to start a conversation with an AI personality
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-wa-bg">
      {/* WhatsApp-style header */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-wa-panel-header border-b border-wa-divider">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden -ml-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-hover"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10 cursor-pointer">
          <AvatarImage src={character.avatar} alt={character.name} className="object-cover" />
          <AvatarFallback className="bg-wa-green text-white text-sm">
            {character.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 cursor-pointer">
          <h2 className="font-medium text-wa-text-primary text-[15px] truncate">
            {character.name}
          </h2>
          <p className="text-[13px] text-wa-text-secondary truncate">
            AI Character
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-hover"
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-hover"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-hover"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleGenerateSummary}>
                <FileText className="h-4 w-4 mr-2" /> Summarize chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClearHistory} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Clear chat history
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages area with WhatsApp pattern */}
      <div className="flex-1 overflow-hidden wa-chat-pattern">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-4 space-y-2 max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block px-4 py-2 bg-wa-bubble-received shadow-soft rounded-lg">
                  <p className="text-wa-text-secondary text-sm">
                    👋 Start a conversation with {character.name}
                  </p>
                </div>
              </div>
            ) : (
              <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`relative max-w-[85%] md:max-w-[65%] wa-bubble ${
                      message.role === "user"
                        ? "wa-bubble-sent wa-bubble-tail-sent"
                        : "wa-bubble-received wa-bubble-tail-received"
                    }`}
                  >
                    
                    <p className={`text-[14px] whitespace-pre-wrap break-words mb-1 ${
                      message.role === "user" ? "text-white" : "text-wa-text-primary"
                    }`}>
                      {message.content}
                    </p>
                    
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[11px] ${
                        message.role === "user" 
                          ? "text-white/70" 
                          : "text-wa-text-muted"
                      }`}>
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.role === "user" && (
                        <svg className="w-4 h-4 text-white/70" viewBox="0 0 16 15" fill="none">
                          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="currentColor"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && showTypingIndicator && (
                <div className="flex justify-start">
                  <div className="relative max-w-[85%] md:max-w-[65%] wa-bubble wa-bubble-received wa-bubble-tail-received">
                    <div className="flex items-center gap-1">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Suggested Responses */}
      {showSuggestions && suggestedResponses.length > 0 && (
        <div className="px-3 py-2 bg-wa-panel-header border-t border-wa-divider">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-wa-text-muted">Suggested responses:</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuggestionsCollapsed(!suggestionsCollapsed)}
                className="h-6 px-2 text-xs text-wa-text-muted hover:text-wa-text-primary hover:bg-wa-hover"
              >
                {suggestionsCollapsed ? (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide
                  </>
                )}
              </Button>
            </div>
            {!suggestionsCollapsed && (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {suggestedResponses.map((suggestion, index) => {
                  const colorClasses = [
                    "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 hover:border-blue-300", // Neutral - Blue
                    "bg-green-50 border-green-200 text-green-800 hover:bg-green-100 hover:border-green-300", // Contextual - Green
                    "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100 hover:border-purple-300" // Context-changing - Purple
                  ];
                  const darkColorClasses = [
                    "dark:bg-blue-900/20 dark:border-blue-700/50 dark:text-blue-200 dark:hover:bg-blue-900/30 dark:hover:border-blue-600/70",
                    "dark:bg-green-900/20 dark:border-green-700/50 dark:text-green-200 dark:hover:bg-green-900/30 dark:hover:border-green-600/70",
                    "dark:bg-purple-900/20 dark:border-purple-700/50 dark:text-purple-200 dark:hover:bg-purple-900/30 dark:hover:border-purple-600/70"
                  ];
                  
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => onSuggestionClick?.(suggestion)}
                      className={`w-full text-left justify-start h-auto py-3 px-4 whitespace-normal break-words ${colorClasses[index % 3]} ${darkColorClasses[index % 3]}`}
                    >
                      <span className="text-sm leading-relaxed">{suggestion}</span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp-style input */}
      <div className="px-3 py-2 bg-wa-panel-header border-t border-wa-divider">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 flex items-center gap-2 bg-wa-panel-bg rounded-3xl px-4 py-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message"
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] text-wa-text-primary placeholder:text-wa-text-muted p-0 h-auto"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="icon"
            className="rounded-full h-11 w-11 bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 disabled:bg-wa-green"
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Chat Summary Dialog */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-2xl bg-wa-panel-bg border-wa-divider">
          <DialogHeader>
            <DialogTitle className="text-wa-text-primary flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chat Summary
            </DialogTitle>
            <DialogDescription className="text-wa-text-secondary">
              A brief summary of your conversation with {character?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {isGeneratingSummary ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-wa-text-secondary">
                  <div className="w-4 h-4 border-2 border-wa-green border-t-transparent rounded-full animate-spin"></div>
                  Generating summary...
                </div>
              </div>
            ) : (
              <div className="bg-wa-bg rounded-lg p-4 border border-wa-divider">
                <p className="text-wa-text-primary leading-relaxed whitespace-pre-wrap">
                  {summary || "No summary available."}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setSummaryOpen(false)}
              className="border-wa-divider text-wa-text-primary hover:bg-wa-hover"
            >
              Close
            </Button>
            {!isGeneratingSummary && (
              <Button
                onClick={handleGenerateSummary}
                className="bg-wa-green hover:bg-wa-green-dark text-white"
              >
                Regenerate
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
