import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation, LanguageCode } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';

export const LanguageSelector: React.FC = () => {
  const { t, currentLanguage, setLanguage, availableLanguages, isLoading } = useTranslation();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(currentLanguage);
  const [isSaving, setIsSaving] = useState(false);

  // Sync selected language when current language changes
  React.useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  const handleApplyLanguage = async () => {
    if (selectedLanguage === currentLanguage) {
      toast({
        title: t('common.info'),
        description: t('message.language_updated'),
      });
      return;
    }

    setIsSaving(true);
    try {
      await setLanguage(selectedLanguage);
      toast({
        title: t('common.success'),
        description: t('message.language_updated'),
      });
    } catch (error) {
      console.error('Error applying language:', error);
      toast({
        title: t('common.error'),
        description: t('message.error_occurred'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentLang = availableLanguages.find(l => l.code === currentLanguage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('settings.language')}
        </CardTitle>
        <CardDescription>
          {t('settings.language_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{currentLang?.flag}</span>
          <span>{t('common.status')}: {currentLang?.nativeName}</span>
        </div>

        <div className="space-y-4">
          <Select
            value={selectedLanguage}
            onValueChange={(value) => setSelectedLanguage(value as LanguageCode)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('form.select_option')} />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    {lang.code === currentLanguage && (
                      <Check className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleApplyLanguage} 
            disabled={isSaving || isLoading}
            className="w-full sm:w-auto"
          >
            {isSaving ? t('common.loading') : t('settings.apply_language')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
