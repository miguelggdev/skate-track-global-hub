import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface MedicalRecordFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const MedicalRecordField: React.FC<MedicalRecordFieldProps> = ({
  label,
  placeholder,
  value,
  onChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Parse the value as JSON array or split by comma for backward compatibility
  const getItems = (): string[] => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value.split(',').map(item => item.trim()).filter(item => item);
    }
  };

  const saveItems = (items: string[]) => {
    onChange(JSON.stringify(items.filter(item => item.trim())));
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      const items = getItems();
      items.push(newItem.trim());
      saveItems(items);
      setNewItem('');
      setIsEditing(false);
    }
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
    setEditingValue(getItems()[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingValue.trim()) {
      const items = getItems();
      items[editingIndex] = editingValue.trim();
      saveItems(items);
      setEditingIndex(null);
      setEditingValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleDeleteItem = (index: number) => {
    const items = getItems();
    items.splice(index, 1);
    saveItems(items);
  };

  const items = getItems();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Add new item form */}
      {isEditing && (
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            autoFocus
          />
          <Button size="sm" onClick={handleAddItem}>
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/10">
            {editingIndex === index ? (
              <div className="flex-1 flex gap-2">
                <Input
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveEdit}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Badge variant="secondary" className="flex-1 justify-start text-left">
                  {item}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditItem(index)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteItem(index)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground italic">
            No hay registros. Haz clic en "Agregar" para añadir el primer elemento.
          </div>
        )}
      </div>
    </div>
  );
};