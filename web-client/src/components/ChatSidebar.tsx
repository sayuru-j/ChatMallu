import { Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
// Theme toggle moved to Settings modal

interface Character {
  id: string;
  name: string;
  avatar?: string;
  policy: string;
  lastMessage?: string;
}

interface Group {
  id: string;
  name: string;
  memberIds: string[];
  autoReply: boolean;
  avatar?: string;
}


interface ChatSidebarProps {
  characters: Character[];
  selectedCharacterId: string | null;
  onSelectCharacter: (id: string) => void;
  onOpenSettings: () => void;
  onCreateCharacter: () => void;
  lastMessageMap?: Record<string, string>;
  unreadMap?: Record<string, number>;
  messages?: Record<string, Message[]>;
  // groups
  groups?: Group[];
  selectedGroupId?: string | null;
  onSelectGroup?: (id: string) => void;
  lastGroupMessageMap?: Record<string, string>;
  unreadGroupMap?: Record<string, number>;
  onDeleteGroup?: (id: string) => void;
  groupMessages?: Record<string, GroupMessage[]>;
}

export const ChatSidebar = ({
  characters,
  selectedCharacterId,
  onSelectCharacter,
  onOpenSettings,
  onCreateCharacter,
  lastMessageMap,
  unreadMap,
  messages = {},
  groups = [],
  selectedGroupId = null,
  onSelectGroup,
  lastGroupMessageMap,
  unreadGroupMap,
  onDeleteGroup,
  groupMessages = {},
}: ChatSidebarProps) => {
  // Sort characters by last message timestamp (most recent first)
  const sortedCharacters = [...characters].sort((a, b) => {
    // Get the last message timestamp for each character
    const getLastMessageTime = (characterId: string) => {
      const characterMessages = messages[characterId];
      if (characterMessages && characterMessages.length > 0) {
        return new Date(characterMessages[characterMessages.length - 1].timestamp).getTime();
      }
      return 0; // No messages
    };

    const timeA = getLastMessageTime(a.id);
    const timeB = getLastMessageTime(b.id);

    // Most recent first
    if (timeA > timeB) return -1;
    if (timeA < timeB) return 1;

    // If same time or no messages, sort by name
    return a.name.localeCompare(b.name);
  });

  // Sort groups by last message timestamp (most recent first)
  const sortedGroups = [...groups].sort((a, b) => {
    // Get the last message timestamp for each group
    const getLastMessageTime = (groupId: string) => {
      const groupMsgs = groupMessages[groupId];
      if (groupMsgs && groupMsgs.length > 0) {
        return new Date(groupMsgs[groupMsgs.length - 1].timestamp).getTime();
      }
      return 0; // No messages
    };

    const timeA = getLastMessageTime(a.id);
    const timeB = getLastMessageTime(b.id);

    // Most recent first
    if (timeA > timeB) return -1;
    if (timeA < timeB) return 1;

    // If same time or no messages, sort by name
    return a.name.localeCompare(b.name);
  });

  return (
    <aside className="w-full md:w-[400px] border-r border-wa-divider bg-wa-panel-bg flex flex-col h-full max-w-full overflow-hidden">
      <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-wa-panel-header border-b border-wa-divider">
        <h1 className="text-base sm:text-lg md:text-xl font-medium text-wa-text-primary truncate">AI Characters</h1>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCreateCharacter}
            className="text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-hover h-8 w-8 sm:h-9 sm:w-9"
            title="Create new character"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-hover h-8 w-8 sm:h-9 sm:w-9"
            title="Settings"
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 overflow-hidden h-full">
        <div className={`${characters.length === 0 ? "flex flex-col items-center justify-center min-h-full" : ""} w-full h-full`}>
          {characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-12 px-3 sm:px-4 min-h-[280px] sm:min-h-[350px] w-full h-full">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-full bg-wa-green/10 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">💬</span>
              </div>
              <p className="text-wa-text-secondary text-xs sm:text-sm mb-3 sm:mb-4 text-center max-w-[240px] sm:max-w-[260px] px-2 break-words leading-relaxed">
                No characters yet. Create your first AI character to start chatting!
              </p>
              <Button
                onClick={onOpenSettings}
                size="sm"
                className="bg-wa-green hover:bg-wa-green-dark text-white text-xs sm:text-sm px-3 sm:px-4 py-2 min-w-[120px] sm:min-w-[140px]"
              >
                Create Character
              </Button>
            </div>
          ) : (
            <div className="w-full">
              {sortedCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => onSelectCharacter(character.id)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-wa-divider transition-colors ${
                    selectedCharacterId === character.id
                      ? "bg-wa-hover"
                      : "hover:bg-wa-hover/50"
                  }`}
                >
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                  <AvatarImage src={character.avatar} alt={character.name} className="object-cover" />
                  <AvatarFallback className="bg-wa-green text-white text-xs sm:text-sm font-medium">
                    {character.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left overflow-hidden min-w-0">
                  <h3 className="font-medium text-wa-text-primary truncate text-sm sm:text-[15px]">
                    {character.name}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-wa-text-secondary truncate mt-0.5">
                    { (lastMessageMap && lastMessageMap[character.id]) || character.lastMessage || "Tap to start chatting" }
                  </p>
                </div>
                {unreadMap && unreadMap[character.id] ? (
                  <div className="ml-1 sm:ml-2 inline-flex min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 px-1 rounded-full bg-wa-green text-white text-[10px] sm:text-[11px] items-center justify-center">
                    {unreadMap[character.id] > 99 ? '99+' : unreadMap[character.id]}
                  </div>
                ) : null}
              </button>
              ))}
            </div>
          )}

          {sortedGroups.length > 0 && (
            <div className="mt-1 sm:mt-2 w-full">
              <div className="px-3 sm:px-4 py-2 text-xs uppercase tracking-wide text-wa-text-muted border-b border-wa-divider/50">Groups</div>
              {sortedGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => onSelectGroup && onSelectGroup(group.id)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-wa-divider transition-colors ${
                    selectedGroupId === group.id ? "bg-wa-hover" : "hover:bg-wa-hover/50"
                  }`}
                >
                  {group.avatar ? (
                    <img src={group.avatar} alt={group.name} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-wa-green/15 text-wa-green flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">GP</div>
                  )}
                  <div className="flex-1 text-left overflow-hidden min-w-0">
                    <h3 className="font-medium text-wa-text-primary truncate text-sm sm:text-[15px]">{group.name}</h3>
                    <p className="text-xs sm:text-[13px] text-wa-text-secondary truncate mt-0.5">
                      {(lastGroupMessageMap && lastGroupMessageMap[group.id]) || ""}
                    </p>
                  </div>
                  {unreadGroupMap && unreadGroupMap[group.id] ? (
                    <div className="ml-1 sm:ml-2 inline-flex min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 px-1 rounded-full bg-wa-green text-white text-[10px] sm:text-[11px] items-center justify-center">
                      {unreadGroupMap[group.id] > 99 ? '99+' : unreadGroupMap[group.id]}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};
