import { useState } from "react";
import { Plus, Trash2, Edit, Settings, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "./ThemeToggle";
import { CreateCharacterForm } from "./CreateCharacterForm";
import { EditCharacterForm } from "./EditCharacterForm";
import { API_CONFIG, getApiBaseUrl } from "@/config/api";
import { useApiHealth } from "@/hooks/useApiHealth";

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
  autoParallel?: boolean;
  lastMessage?: string;
}

interface CharacterSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characters: Character[];
  onAddCharacter: (character: Omit<Character, "id">) => void;
  onUpdateCharacter: (id: string, character: Partial<Character>) => void;
  onDeleteCharacter: (id: string) => void;
  onEditCharacter?: (character: Character) => void;
  editingId?: string | null;
  onCancelEdit?: () => void;
  activeTab: 'characters' | 'groups' | 'chat' | 'api';
  onTabChange: (tab: 'characters' | 'groups' | 'chat' | 'api') => void;
  groups?: Group[];
  onAddGroup?: (group: Omit<Group, "id">) => void;
  onUpdateGroup?: (id: string, group: Partial<Group>) => void;
  onDeleteGroup?: (id: string) => void;
  onEditGroup?: (group: Group) => void;
  showGroupForm?: boolean;
  onShowGroupForm?: (show: boolean) => void;
  globalPolicy?: string;
  onGlobalPolicyChange?: (policy: string) => void;
  temperature?: number;
  onTemperatureChange?: (value: number) => void;
  contextLength?: number;
  onContextLengthChange?: (value: number) => void;
  maxTokens?: number;
  onMaxTokensChange?: (value: number) => void;
  showTypingIndicator?: boolean;
  onTypingIndicatorToggle?: (enabled: boolean) => void;
}

export const CharacterSettings = ({
  open,
  onOpenChange,
  characters = [],
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onEditCharacter,
  editingId = null,
  onCancelEdit,
  activeTab,
  onTabChange,
  groups = [],
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onEditGroup,
  showGroupForm = false,
  onShowGroupForm,
  globalPolicy = '',
  onGlobalPolicyChange,
  temperature = 0.7,
  onTemperatureChange,
  contextLength = 65536,
  onContextLengthChange,
  maxTokens = 2000,
  onMaxTokensChange,
  showTypingIndicator = true,
  onTypingIndicatorToggle,
}: CharacterSettingsProps) => {
  // Character form state
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  // Group form state
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [groupEditingId, setGroupEditingId] = useState<string | null>(null);
  const [groupAvatar, setGroupAvatar] = useState("");

  // API state
  const [apiUrl, setApiUrl] = useState(() => getApiBaseUrl());
  const { health } = useApiHealth();

  const SAMPLE_GLOBAL_POLICY = `No speaker tags or quoted blocks. Output plain chat lines only.

No role narration or stage directions.

Do not invent facts about yourself. If unsure, ask briefly.

Keep it concise: max 2 lines, each under ~18 words.

Match user energy (casual ↔ formal) but never performative.

Pay attention to conversation context and respond meaningfully to what's being discussed.

If user sends a single-word ping: reply with a short ack + a one-line question.

Anti-patterns to block (exact strings/regex):

Block: (?i)\\b(it'?s (your )?boy|hey (guys|girl|ya)|how can i help)\\b

Block: (?i)^(aiden|lyra)\\s*:

Strip leading/trailing quotes.`;

  // Character handlers
  const handleCreateCharacter = (character: { name: string; avatar?: string; policy: string }) => {
    onAddCharacter(character);
    setShowCharacterForm(false);
  };

  const handleUpdateCharacter = (id: string, updates: Partial<Character>) => {
    onUpdateCharacter(id, updates);
    setEditingCharacter(null);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
  };

  const handleCancelCreate = () => {
    setShowCharacterForm(false);
  };

  const handleCancelEdit = () => {
    setEditingCharacter(null);
  };

  const handleRestoreDefaults = () => {
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

    // Check if defaults already exist
    const hasDefaults = characters.some(char => char.id === 'default-1' || char.id === 'default-2');
    
    if (hasDefaults) {
      alert('Default characters already exist!');
      return;
    }

    // Add default characters
    defaultCharacters.forEach(char => {
      onAddCharacter(char);
    });
  };

  // Group handlers
  const handleSaveGroup = () => {
    if (!groupName.trim() || groupMembers.length === 0) return;

    if (groupEditingId) {
      onUpdateGroup?.(groupEditingId, { name: groupName.trim(), memberIds: groupMembers, avatar: groupAvatar });
      setGroupEditingId(null);
    } else {
      onAddGroup?.({ name: groupName.trim(), memberIds: groupMembers, autoReply: true, autoParallel: false, avatar: groupAvatar });
    }
    setGroupName("");
    setGroupMembers([]);
    setGroupAvatar("");
    onShowGroupForm?.(false);
  };

  const handleEditGroup = (group: Group) => {
    setGroupEditingId(group.id);
    setGroupName(group.name);
    setGroupMembers(group.memberIds);
    setGroupAvatar(group.avatar || "");
    onShowGroupForm?.(true);
    onTabChange('groups');
  };

  const handleCancelGroup = () => {
    setGroupEditingId(null);
    setGroupName("");
    setGroupMembers([]);
    setGroupAvatar("");
    onShowGroupForm?.(false);
  };

  const handleLoadSamplePolicy = () => {
    onGlobalPolicyChange?.(SAMPLE_GLOBAL_POLICY);
  };

  const handleClearGlobalPolicy = () => {
    onGlobalPolicyChange?.('');
  };

  const handleApiUrlChange = (newUrl: string) => {
    setApiUrl(newUrl);
    localStorage.setItem('chatmallu_api_url', newUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] md:w-full bg-wa-panel-bg border-wa-divider overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-wa-text-primary text-xl">Settings</DialogTitle>
              <DialogDescription className="text-wa-text-secondary">
                Manage your AI characters and API configuration
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </DialogHeader>

        <div className="px-6">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="w-full h-full flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 gap-1 mb-6 flex-shrink-0">
            <TabsTrigger value="characters" className="w-full justify-center text-xs sm:text-sm">Characters</TabsTrigger>
            <TabsTrigger value="groups" className="w-full justify-center text-xs sm:text-sm">Groups</TabsTrigger>
            <TabsTrigger value="chat" className="w-full justify-center text-xs sm:text-sm">Chat</TabsTrigger>
            <TabsTrigger value="api" className="w-full justify-center text-xs sm:text-sm">API</TabsTrigger>
          </TabsList>

            <TabsContent value="characters" className="space-y-4 overflow-y-auto overflow-x-hidden pb-6 flex-1">
              {/* Create Character Form */}
              {showCharacterForm && (
                <CreateCharacterForm
                  onSave={handleCreateCharacter}
                  onCancel={handleCancelCreate}
                />
              )}

              {/* Edit Character Form */}
              {editingCharacter && (
                <EditCharacterForm
                  character={editingCharacter}
                  onSave={handleUpdateCharacter}
                  onCancel={handleCancelEdit}
                />
              )}

              {/* Characters List */}
              <div className="space-y-3 p-4 bg-wa-bg rounded-lg border border-wa-divider">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label className="text-wa-text-primary font-medium">Your Characters ({characters.length})</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => setShowCharacterForm(true)}
                      size="sm"
                      className="bg-wa-green hover:bg-wa-green-dark text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create Character
                    </Button>
                    <Button
                      onClick={() => handleRestoreDefaults()}
                      size="sm"
                      variant="outline"
                      className="border-wa-divider text-wa-text-primary hover:bg-wa-hover"
                    >
                      Restore Defaults
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[50vh] max-h-[50vh] border border-wa-divider rounded-lg bg-wa-panel-bg overflow-hidden">
                  <div className="p-3 space-y-2 w-full">
                    {characters.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-2 sm:px-4 min-h-[250px] sm:min-h-[300px]">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-wa-green/10 flex items-center justify-center">
                          <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-wa-green" />
                        </div>
                        <p className="text-wa-text-secondary text-xs sm:text-sm text-center max-w-xs px-2">
                          No characters yet. Create your first one above!
                        </p>
                      </div>
                    ) : (
                      characters.map((character) => (
                        <div
                          key={character.id}
                          className="flex items-center gap-2 p-2 sm:p-3 rounded-lg border border-wa-divider bg-wa-bg hover:bg-wa-hover transition-colors w-full max-w-full"
                        >
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                            <AvatarImage src={character.avatar} alt={character.name} className="object-cover" />
                            <AvatarFallback className="bg-wa-green text-white text-xs">
                              {character.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h4 className="font-medium text-sm truncate text-wa-text-primary">
                              {character.name}
                            </h4>
                            <p className="text-xs text-wa-text-secondary truncate">
                              {character.policy.slice(0, 30)}...
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 min-w-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditCharacter(character)}
                              className="h-6 w-6 sm:h-8 sm:w-8 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-panel-bg"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onDeleteCharacter(character.id)}
                              className="h-6 w-6 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="groups" className="space-y-4 overflow-y-auto overflow-x-hidden pb-6 flex-1">
              <div className="grid gap-4 lg:grid-cols-2">
                {(showGroupForm || groupEditingId) && (
                  <div className="space-y-4 p-4 bg-wa-bg rounded-lg border border-wa-divider">
                    <div className="space-y-2">
                      <Label htmlFor="gname" className="text-wa-text-primary font-medium">Group Name</Label>
                      <Input id="gname" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g., Writers Room" className="bg-wa-panel-bg border-wa-divider text-wa-text-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gavatar" className="text-wa-text-primary font-medium">Group Avatar URL (optional)</Label>
                      <Input id="gavatar" value={groupAvatar} onChange={(e) => setGroupAvatar(e.target.value)} placeholder="https://example.com/group-avatar.jpg" className="bg-wa-panel-bg border-wa-divider text-wa-text-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-wa-text-primary font-medium">Select Members</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-wa-divider rounded-lg p-2">
                        {characters.map((char) => (
                          <label key={char.id} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={groupMembers.includes(char.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGroupMembers([...groupMembers, char.id]);
                                } else {
                                  setGroupMembers(groupMembers.filter(id => id !== char.id));
                                }
                              }}
                              className="rounded border-wa-divider"
                            />
                            <span className="text-wa-text-primary">{char.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveGroup} className="bg-wa-green hover:bg-wa-green-dark text-white">
                        {groupEditingId ? 'Update' : 'Create'} Group
                      </Button>
                      <Button variant="outline" onClick={handleCancelGroup} className="border-wa-divider text-wa-text-primary hover:bg-wa-hover">Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3 p-4 bg-wa-bg rounded-lg border border-wa-divider">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label className="text-wa-text-primary font-medium">Your Groups ({groups.length})</Label>
                    <Button
                      onClick={() => onShowGroupForm?.(true)}
                      size="sm"
                      className="bg-wa-green hover:bg-wa-green-dark text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create Group
                    </Button>
                  </div>
                  <ScrollArea className="h-[50vh] max-h-[50vh] border border-wa-divider rounded-lg bg-wa-panel-bg overflow-hidden">
                    <div className="p-3 space-y-2 w-full">
                      {groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-2 sm:px-4 min-h-[150px] sm:min-h-[200px]">
                          <p className="text-wa-text-secondary text-xs sm:text-sm text-center px-2">No groups yet. Create your first one.</p>
                        </div>
                      ) : (
                        groups.map((g) => (
                          <div key={g.id} className="p-2 sm:p-3 rounded-lg border border-wa-divider bg-wa-bg hover:bg-wa-hover transition-colors w-full max-w-full">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="text-sm font-medium text-wa-text-primary truncate">{g.name}</div>
                                <div className="text-xs text-wa-text-secondary">{g.memberIds.length} members</div>
                              </div>
                              <div className="flex gap-1 sm:gap-2 items-center flex-wrap flex-shrink-0 min-w-0">
                                <Button size="sm" variant="ghost" onClick={() => handleEditGroup(g)} className="text-xs">Edit</Button>
                                <label className="text-xs text-wa-text-secondary flex items-center gap-1">
                                  <input type="checkbox" checked={!!g.autoParallel} onChange={(e) => {
                                    onUpdateGroup?.(g.id, { autoParallel: e.target.checked });
                                  }} /> Parallel
                                </label>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs" onClick={() => {
                                  onDeleteGroup?.(g.id);
                                }}>Delete</Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="space-y-4 overflow-y-auto overflow-x-hidden pb-6 flex-1">
              <div className="space-y-4 p-4 bg-wa-bg rounded-lg border border-wa-divider">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="globalPolicy" className="text-wa-text-primary font-medium">
                      Global Policy (Optional)
                    </Label>
                    <Textarea
                      id="globalPolicy"
                      placeholder="Define a global policy that applies to all characters..."
                      value={globalPolicy}
                      onChange={(e) => onGlobalPolicyChange?.(e.target.value)}
                      rows={6}
                      className="bg-wa-panel-bg border-wa-divider text-wa-text-primary resize-none"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleLoadSamplePolicy} variant="outline" className="text-xs border-wa-divider text-wa-text-secondary hover:bg-wa-hover">Load Sample</Button>
                      <Button onClick={handleClearGlobalPolicy} variant="outline" className="text-xs border-wa-divider text-wa-text-secondary hover:bg-wa-hover">Clear</Button>
                    </div>
                    <p className="text-xs text-wa-text-secondary">
                      This policy will be prepended to every character's policy, overriding safety measures.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-wa-text-primary font-medium">Typing Indicator</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="typingIndicator"
                        checked={showTypingIndicator}
                        onChange={(e) => onTypingIndicatorToggle?.(e.target.checked)}
                        className="rounded border-wa-divider"
                      />
                      <label htmlFor="typingIndicator" className="text-sm text-wa-text-secondary">
                        Show typing indicator during AI responses
                      </label>
                    </div>
                    <p className="text-xs text-wa-text-secondary">
                      When enabled, shows typing animation. When disabled, messages appear directly as they stream.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="temperature" className="text-wa-text-primary font-medium">Temperature</Label>
                      <Input
                        id="temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => onTemperatureChange?.(parseFloat(e.target.value))}
                        className="bg-wa-panel-bg border-wa-divider text-wa-text-primary"
                      />
                      <p className="text-xs text-wa-text-secondary">Controls randomness (0-2)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contextLength" className="text-wa-text-primary font-medium">Context Length</Label>
                      <Input
                        id="contextLength"
                        type="number"
                        min="1024"
                        max="131072"
                        step="1024"
                        value={contextLength}
                        onChange={(e) => onContextLengthChange?.(parseInt(e.target.value))}
                        className="bg-wa-panel-bg border-wa-divider text-wa-text-primary"
                      />
                      <p className="text-xs text-wa-text-secondary">Memory size (1K-128K)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxTokens" className="text-wa-text-primary font-medium">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        min="32"
                        max="4096"
                        step="32"
                        value={maxTokens}
                        onChange={(e) => onMaxTokensChange?.(parseInt(e.target.value))}
                        className="bg-wa-panel-bg border-wa-divider text-wa-text-primary"
                      />
                      <p className="text-xs text-wa-text-secondary">Response length (32-4K)</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4 overflow-y-auto overflow-x-hidden pb-6 flex-1">
              <div className="space-y-4 p-4 bg-wa-bg rounded-lg border border-wa-divider">
                <div className="space-y-2">
                  <Label className="text-wa-text-primary font-medium">API Connection Status</Label>
                  <div className="flex items-center gap-2 text-sm">
                    {health.status === 'healthy' ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Wifi className="h-4 w-4" />
                        <span>Connected</span>
                      </div>
                    ) : health.status === 'error' ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <WifiOff className="h-4 w-4" />
                        <span>Error: {health.message}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Wifi className="h-4 w-4" />
                        <span>Checking...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiUrl" className="text-wa-text-primary font-medium">API Base URL</Label>
                  <Input
                    id="apiUrl"
                    value={apiUrl}
                    onChange={(e) => handleApiUrlChange(e.target.value)}
                    placeholder="http://localhost:8000"
                    className="bg-wa-panel-bg border-wa-divider text-wa-text-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-wa-text-primary font-medium">Available Endpoints</Label>
                  <div className="space-y-1 text-sm font-mono">
                    <div>Health: <code className="bg-wa-panel-bg px-1 rounded">{apiUrl}/health</code></div>
                    <div>Chat: <code className="bg-wa-panel-bg px-1 rounded">{apiUrl}/chat</code></div>
                    <div>Stream: <code className="bg-wa-panel-bg px-1 rounded">{apiUrl}/chat/stream</code></div>
                    <div>Models: <code className="bg-wa-panel-bg px-1 rounded">{apiUrl}/models</code></div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

