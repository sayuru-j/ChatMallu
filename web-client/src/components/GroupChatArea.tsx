import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { MoreVertical, Trash2, Users, Clock, Settings, ChevronDown, ChevronUp, FileText } from "lucide-react";

interface CharacterRef {
  id: string;
  name: string;
  avatar?: string;
}

interface GroupMessage {
  id: string;
  content: string;
  senderId: string | 'user';
  timestamp: Date | string | number;
}

interface GroupChatAreaProps {
  groupName: string;
  groupAvatar?: string;
  members: CharacterRef[];
  messages: GroupMessage[];
  onSend: (content: string) => void;
  onBack: () => void;
  isTyping?: boolean;
  onClearHistory?: () => void;
  autoReplyEnabled: boolean;
  onToggleAutoReply: () => void;
  autoParallelEnabled: boolean;
  onToggleParallel: () => void;
  waitTimePerWord: number;
  onWaitTimeChange: (value: number) => void;
  characterMemorySize: number;
  onCharacterMemorySizeChange: (value: number) => void;
  apiContextSize: number;
  onApiContextSizeChange: (value: number) => void;
  suggestedResponses?: string[];
  showSuggestions?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  onGenerateSummary?: () => Promise<string>;
  showTypingIndicator?: boolean;
}

export const GroupChatArea = ({ 
  groupName, 
  groupAvatar, 
  members, 
  messages, 
  onSend, 
  onBack, 
  isTyping = false, 
  onClearHistory, 
  autoReplyEnabled, 
  onToggleAutoReply,
  autoParallelEnabled,
  onToggleParallel,
  waitTimePerWord,
  onWaitTimeChange,
  characterMemorySize,
  onCharacterMemorySizeChange,
  apiContextSize,
  onApiContextSizeChange,
  suggestedResponses = [],
  showSuggestions = false,
  onSuggestionClick,
  onGenerateSummary,
  showTypingIndicator = true
}: GroupChatAreaProps) => {
  const [input, setInput] = useState("");
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Reset collapse state when suggestions are cleared
  useEffect(() => {
    if (!showSuggestions || suggestedResponses.length === 0) {
      setSuggestionsCollapsed(false);
    }
  }, [showSuggestions, suggestedResponses]);

  const formatTs = (ts: Date | string | number) => {
    const d = ts instanceof Date ? ts : new Date(ts);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Clean display-only: remove leading speaker tags like "Name" or "Name:"
  const sanitizeGroupContent = (text: string, speakerName?: string) => {
    if (!text) return "";
    let s = text;
    // Strip surrounding quotes
    s = s.replace(/^["'""`]+|["'""`]+$/g, "");
    if (speakerName && speakerName.trim().length > 0) {
      const name = speakerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Remove lines at the very start that are just the speaker name
      const reNameLine = new RegExp(`^(?:\\s*${name}\\s*\n)+`, 'i');
      s = s.replace(reNameLine, "");
      // Remove repeated leading "Name:" prefixes
      const reLeadingTag = new RegExp(`^\\s*(?:${name}\\s*:\\s*)+`, 'i');
      s = s.replace(reLeadingTag, "");
    }
    // Collapse excessive empty lines at the start
    s = s.replace(/^(\s*\n)+/, "");
    // Trim and prevent superfluous spaces
    s = s.trim();
    return s;
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

  return (
    <div className="flex-1 flex flex-col bg-wa-bg">
      <header className="flex items-center gap-3 px-4 py-2.5 bg-wa-panel-header border-b border-wa-divider">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden -ml-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-hover">←</Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-wa-green flex items-center justify-center text-white font-medium text-sm">
              {groupAvatar ? (
                <img src={groupAvatar} alt={groupName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <Users className="h-5 w-5" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-wa-text-primary truncate">{groupName}</h2>
            <p className="text-xs text-wa-text-secondary">{members.length} members</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-hover">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <DropdownMenuItem onClick={handleGenerateSummary}>
                <FileText className="h-4 w-4 mr-2"/> Summarize chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClearHistory} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2"/> Clear group history
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleAutoReply}>
                {autoReplyEnabled ? 'Disable' : 'Enable'} auto replies
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleParallel}>
                {autoParallelEnabled ? 'Disable' : 'Enable'} parallel replies
              </DropdownMenuItem>
              <div className="px-2 py-3 border-t border-wa-divider space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-wa-text-secondary" />
                    <span className="text-sm text-wa-text-primary">Wait time per word: {waitTimePerWord}ms</span>
                  </div>
                  <Slider
                    value={[waitTimePerWord]}
                    onValueChange={(value) => onWaitTimeChange(value[0])}
                    min={50}
                    max={1000}
                    step={50}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-wa-text-secondary" />
                    <span className="text-sm text-wa-text-primary">Character memory: {characterMemorySize} messages</span>
                  </div>
                  <Slider
                    value={[characterMemorySize]}
                    onValueChange={(value) => onCharacterMemorySizeChange(value[0])}
                    min={5}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-wa-text-secondary" />
                    <span className="text-sm text-wa-text-primary">API context: {apiContextSize} messages</span>
                  </div>
                  <Slider
                    value={[apiContextSize]}
                    onValueChange={(value) => onApiContextSizeChange(value[0])}
                    min={3}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages area with WhatsApp pattern */}
      <div className="flex-1 overflow-hidden wa-chat-pattern">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-4 space-y-2 max-w-4xl mx-auto">
            {messages.map((message) => {
              const sender = message.senderId === 'user' ? 
                { name: 'You', avatar: undefined } : 
                members.find(m => m.id === message.senderId) || { name: 'Unknown', avatar: undefined };
              
              const isUser = message.senderId === 'user';
              const sanitizedContent = sanitizeGroupContent(message.content, sender.name);
              
              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-wa-green flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {sender.avatar ? (
                        <img src={sender.avatar} alt={sender.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        sender.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  )}
                  <div className={`max-w-[85%] md:max-w-[65%] ${isUser ? 'order-first' : ''}`}>
                    {!isUser && (
                      <div className="text-xs text-wa-text-secondary mb-1 px-1">
                        {sender.name}
                      </div>
                    )}
                    <div className={`relative rounded-lg px-3 py-2 shadow-soft ${
                      isUser 
                        ? 'bg-wa-bubble-sent text-white rounded-br-none' 
                        : 'bg-wa-bubble-received text-wa-text-primary rounded-bl-none'
                    }`}>
                      <div className={`absolute bottom-0 ${
                        isUser ? 'right-0 -mr-2' : 'left-0 -ml-2'
                      } ${
                        isUser 
                          ? 'border-l-[10px] border-l-wa-bubble-sent border-t-[10px] border-t-transparent' 
                          : 'border-r-[10px] border-r-wa-bubble-received border-t-[10px] border-t-transparent'
                      }`} />
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {sanitizedContent}
                      </p>
                      <div className={`text-xs mt-1 ${
                        isUser ? 'text-white/70' : 'text-wa-text-muted'
                      }`}>
                        {formatTs(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && showTypingIndicator && (
              <div className="flex justify-start">
                <div className="relative max-w-[85%] md:max-w-[65%] rounded-lg px-3 py-2 shadow-soft bg-wa-bubble-received rounded-bl-none">
                  <div className="absolute bottom-0 left-0 -ml-2 border-r-[10px] border-r-wa-bubble-received border-t-[10px] border-t-transparent" />
                  <div className="flex items-center gap-1">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
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

      <div className="px-3 py-2 bg-wa-panel-header border-t border-wa-divider">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim()) { onSend(input.trim()); setInput(''); } } }} placeholder="Type a message" className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] text-wa-text-primary placeholder:text-wa-text-muted p-0 h-auto"/>
          <Button onClick={() => { if (input.trim()) { onSend(input.trim()); setInput(''); } }} disabled={!input.trim()} size="icon" className="rounded-full h-11 w-11 bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 disabled:bg-wa-green">→</Button>
        </div>
      </div>

      {/* Chat Summary Dialog */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-2xl bg-wa-panel-bg border-wa-divider">
          <DialogHeader>
            <DialogTitle className="text-wa-text-primary flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Group Chat Summary
            </DialogTitle>
            <DialogDescription className="text-wa-text-secondary">
              A brief summary of the conversation in {groupName}
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