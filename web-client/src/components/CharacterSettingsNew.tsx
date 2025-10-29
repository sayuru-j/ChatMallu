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
}: CharacterSettingsProps) => {
  // Character form state
  const [name, setName] = useState("");
  const [policy, setPolicy] = useState("");
  const [avatar, setAvatar] = useState("");
  const [showCharacterForm, setShowCharacterForm] = useState(false);

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
  const handleSave = () => {
    if (!name.trim() || !policy.trim()) return;

    if (editingId) {
      onUpdateCharacter(editingId, { name: name.trim(), policy: policy.trim(), avatar: avatar });
      onCancelEdit?.();
    } else {
      onAddCharacter({ name: name.trim(), policy: policy.trim(), avatar: avatar });
    }
    setName("");
    setPolicy("");
    setAvatar("");
    setShowCharacterForm(false);
  };

  const handleEdit = (character: Character) => {
    setName(character.name);
    setPolicy(character.policy);
    setAvatar(character.avatar || "");
    onEditCharacter?.(character);
  };

  const handleCancel = () => {
    setName("");
    setPolicy("");
    setAvatar("");
    setShowCharacterForm(false);
    onCancelEdit?.();
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
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] md:w-full bg-wa-panel-bg border-wa-divider overflow-auto p-0">
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
          <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 gap-1 mb-6">
              <TabsTrigger value="characters" className="w-full justify-center text-xs sm:text-sm">Characters</TabsTrigger>
              <TabsTrigger value="groups" className="w-full justify-center text-xs sm:text-sm">Groups</TabsTrigger>
              <TabsTrigger value="chat" className="w-full justify-center text-xs sm:text-sm">Chat</TabsTrigger>
              <TabsTrigger value="api" className="w-full justify-center text-xs sm:text-sm">API</TabsTrigger>
            </TabsList>

            <TabsContent value="characters" className="space-y-4 overflow-auto pb-6">
              <div className="grid gap-4 lg:grid-cols-2">
                {(showCharacterForm || editingId) && (
                  <div className="space-y-4 p-4 bg-wa-bg rounded-lg border border-wa-divider">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-wa-text-primary font-medium">
                        Character Name
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Aiden"
                        className="bg-wa-panel-bg border-wa-divider text-wa-text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatar" className="text-wa-text-primary font-medium">
                        Avatar URL (optional)
                      </Label>
                      <Input
                        id="avatar"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="bg-wa-panel-bg border-wa-divider text-wa-text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="policy" className="text-wa-text-primary font-medium">
                        Character Policy
                      </Label>
                      <Textarea
                        id="policy"
                        value={policy}
                        onChange={(e) => setPolicy(e.target.value)}
                        placeholder="Define how this character should behave..."
                        rows={6}
                        className="bg-wa-panel-bg border-wa-divider text-wa-text-primary resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="bg-wa-green hover:bg-wa-green-dark text-white">
                        {editingId ? 'Update' : 'Create'} Character
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className="border-wa-divider text-wa-text-primary hover:bg-wa-hover">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3 p-4 bg-wa-bg rounded-lg border border-wa-divider">
                  <Label className="text-wa-text-primary font-medium">Your Characters ({characters.length})</Label>
                  <ScrollArea className="h-[50vh] max-h-[50vh] border border-wa-divider rounded-lg bg-wa-panel-bg">
                    <div className="p-3 space-y-2">
                      {characters.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-wa-green/10 flex items-center justify-center">
                            <Plus className="h-8 w-8 text-wa-green" />
                          </div>
                          <p className="text-wa-text-secondary text-sm">
                            No characters yet. Create your first one above!
                          </p>
                        </div>
                      ) : (
                        characters.map((character) => (
                          <div
                            key={character.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-lg border border-wa-divider bg-wa-bg hover:bg-wa-hover transition-colors"
                          >
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={character.avatar} alt={character.name} className="object-cover" />
                              <AvatarFallback className="bg-wa-green text-white text-xs">
                                {character.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate text-wa-text-primary">
                                {character.name}
                              </h4>
                              <p className="text-xs text-wa-text-secondary truncate">
                                {character.policy.slice(0, 60)}...
                              </p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(character)}
                                className="h-8 w-8 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-panel-bg"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => onDeleteCharacter(character.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="groups" className="space-y-4 overflow-auto pb-6">
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
                  <Label className="text-wa-text-primary font-medium">Your Groups ({groups.length})</Label>
                  <ScrollArea className="h-[50vh] max-h-[50vh] border border-wa-divider rounded-lg bg-wa-panel-bg">
                    <div className="p-3 space-y-2">
                      {groups.length === 0 ? (
                        <div className="text-center py-12 px-4 text-wa-text-secondary text-sm">No groups yet. Create your first one.</div>
                      ) : (
                        groups.map((g) => (
                          <div key={g.id} className="p-3 rounded-lg border border-wa-divider bg-wa-bg hover:bg-wa-hover transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-wa-text-primary">{g.name}</div>
                                <div className="text-xs text-wa-text-secondary">{g.memberIds.length} members</div>
                              </div>
                              <div className="flex gap-2 items-center">
                                <Button size="sm" variant="ghost" onClick={() => handleEditGroup(g)}>Edit</Button>
                                <label className="text-xs text-wa-text-secondary flex items-center gap-1">
                                  <input type="checkbox" checked={!!g.autoParallel} onChange={(e) => {
                                    onUpdateGroup?.(g.id, { autoParallel: e.target.checked });
                                  }} /> Parallel
                                </label>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
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

            <TabsContent value="chat" className="space-y-4 overflow-auto pb-6">
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

            <TabsContent value="api" className="space-y-4 overflow-auto pb-6">
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
