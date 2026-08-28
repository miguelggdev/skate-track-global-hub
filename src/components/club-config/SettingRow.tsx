import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SystemSetting } from '@/pages/ClubConfig';
import { Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SettingRowProps {
  setting: SystemSetting;
  onUpdate: () => void;
  onLocalChange?: (settingId: string, value: string) => void;
  bulkMode?: boolean;
  hasChanges?: boolean;
}

const SettingRow = ({ setting, onUpdate, onLocalChange, bulkMode = false, hasChanges = false }: SettingRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(setting.setting_value);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (bulkMode) {
      // In bulk mode, just notify parent of change
      onLocalChange?.(setting.id, value);
      setIsEditing(false);
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: value })
        .eq('id', setting.id);

      if (error) throw error;
      
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(setting.setting_value);
    setIsEditing(false);
  };

  const renderValueInput = () => {
    if (setting.setting_type === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={value === 'true'}
            onCheckedChange={(checked) => setValue(checked ? 'true' : 'false')}
            disabled={!isEditing}
          />
          <Label>{value === 'true' ? 'Activado' : 'Desactivado'}</Label>
        </div>
      );
    }

    if (setting.setting_type === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={!isEditing}
          className={!isEditing ? "bg-muted" : ""}
        />
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={!isEditing}
        className={!isEditing ? "bg-muted" : ""}
      />
    );
  };

  const getSettingDisplayName = (key: string) => {
    const names: Record<string, string> = {
      'max_athletes_per_coach': 'Máximo atletas por entrenador',
      'session_duration_default': 'Duración sesión por defecto (min)',
      'advance_payment_required': 'Pago por adelantado requerido',
      'late_payment_fee': 'Tarifa por pago tardío (€)',
      'email_notifications': 'Notificaciones por email',
      'sms_notifications': 'Notificaciones por SMS',
      'auto_backup': 'Copia de seguridad automática',
      'competition_registration_deadline': 'Plazo inscripción competiciones (días)',
      'notifications_email_enabled': 'Notificaciones por email',
      'notifications_sms_enabled': 'Notificaciones por SMS',
      'telegram_chat_id': 'Chat ID de Telegram del club',
      'telegram_notify_payments': 'Telegram: avisar pagos recibidos',
      'telegram_notify_new_athletes': 'Telegram: avisar atletas nuevos',
      'telegram_notify_security': 'Telegram: avisar alertas de seguridad',
      'telegram_notify_automation_failures': 'Telegram: avisar automatizaciones fallidas',
    };
    return names[key] || key;
  };

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg ${hasChanges ? 'border-primary bg-primary/5' : ''}`}>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <Label className="text-sm font-medium">
              {getSettingDisplayName(setting.setting_key)}
            </Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {setting.description}
              </p>
            )}
          </div>
          <div className="w-48">
            {renderValueInput()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        {isEditing ? (
          <>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SettingRow;