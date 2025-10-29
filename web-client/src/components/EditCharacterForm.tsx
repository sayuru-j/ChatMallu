import { useState, useEffect } from "react";
import { Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Character {
  id: string;
  name: string;
  avatar?: string;
  policy: string;
  lastMessage?: string;
}

interface EditCharacterFormProps {
  character: Character;
  onSave: (id: string, updates: Partial<Character>) => void;
  onCancel: () => void;
}

export const EditCharacterForm = ({ character, onSave, onCancel }: EditCharacterFormProps) => {
  const [name, setName] = useState(character.name);
  const [avatar, setAvatar] = useState(character.avatar || "");
  const [policy, setPolicy] = useState(character.policy);

  // Update form when character changes
  useEffect(() => {
    setName(character.name);
    setAvatar(character.avatar || "");
    setPolicy(character.policy);
  }, [character]);

  const handleSave = () => {
    if (!name.trim() || !policy.trim()) return;
    
    onSave(character.id, {
      name: name.trim(),
      policy: policy.trim(),
      avatar: avatar.trim()
    });
  };

  const handleCancel = () => {
    // Reset to original values
    setName(character.name);
    setAvatar(character.avatar || "");
    setPolicy(character.policy);
    onCancel();
  };

  return (
    <div className="space-y-4 p-4 bg-wa-bg rounded-lg border border-wa-divider">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-wa-green" />
          <h3 className="text-lg font-medium text-wa-text-primary">Edit Character</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-8 w-8 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-hover"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-name" className="text-wa-text-primary font-medium">
          Character Name
        </Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Aiden"
          className="bg-wa-panel-bg border-wa-divider text-wa-text-primary"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-avatar" className="text-wa-text-primary font-medium">
          Avatar URL (optional)
        </Label>
        <Input
          id="edit-avatar"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          className="bg-wa-panel-bg border-wa-divider text-wa-text-primary"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-policy" className="text-wa-text-primary font-medium">
          Character Policy
        </Label>
        <Textarea
          id="edit-policy"
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          placeholder="Define how this character should behave..."
          rows={6}
          className="bg-wa-panel-bg border-wa-divider text-wa-text-primary resize-none"
        />
      </div>
      
      <div className="flex gap-2">
        <Button onClick={handleSave} className="bg-wa-green hover:bg-wa-green-dark text-white">
          Update Character
        </Button>
        <Button variant="outline" onClick={handleCancel} className="border-wa-divider text-wa-text-primary hover:bg-wa-hover">
          Cancel
        </Button>
      </div>
    </div>
  );
};
