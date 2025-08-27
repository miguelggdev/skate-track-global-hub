import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';

interface HistoryRecordFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'date' | 'number';
}

export const HistoryRecordField: React.FC<HistoryRecordFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text'
}) => {
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const getItems = (): string[] => {
    if (!value) return [];
    
    try {
      // Try to parse as JSON array first
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && item.toString().trim() !== '');
      }
    } catch {
      // If JSON parsing fails, treat as comma-separated values for backward compatibility
      return value.split(',').map(item => item.trim()).filter(item => item !== '');
    }
    
    return [];
  };

  const saveItems = (items: string[]) => {
    const filteredItems = items.filter(item => item && item.toString().trim() !== '');
    onChange(JSON.stringify(filteredItems));
  };

  const addItem = () => {
    if (newItem.trim()) {
      const currentItems = getItems();
      saveItems([...currentItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const editItem = (index: number) => {
    const items = getItems();
    setEditingIndex(index);
    setEditingValue(items[index]);
  };

  const saveEdit = () => {
    if (editingValue.trim() && editingIndex !== null) {
      const items = getItems();
      items[editingIndex] = editingValue.trim();
      saveItems(items);
      setEditingIndex(null);
      setEditingValue('');
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const deleteItem = (index: number) => {
    const items = getItems();
    items.splice(index, 1);
    saveItems(items);
  };

  const items = getItems();

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type={type}
          placeholder={placeholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
        />
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={addItem}
          disabled={!newItem.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {items.length > 0 && (
        <div className="space-y-1 mt-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-muted/50 p-2 rounded-md text-sm"
            >
              {editingIndex === index ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type={type}
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    className="flex-1 h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={saveEdit}
                    className="h-8 w-8"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={cancelEdit}
                    className="h-8 w-8"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-1">{item}</span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => editItem(index)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteItem(index)}
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};