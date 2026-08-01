import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, User, Heart, Target, Sparkles } from 'lucide-react';

interface AthleteSportsProfileProps {
  athleteId: string | null;
  bio?: string | null;
  personalValues?: string | null;
  shortTermGoals?: string | null;
  longTermGoals?: string | null;
}

const AthleteSportsProfile: React.FC<AthleteSportsProfileProps> = ({
  athleteId,
  bio,
  personalValues,
  shortTermGoals,
  longTermGoals,
}) => {
  // Parse personal values into chips (split by comma or line break)
  const valueChips = personalValues
    ? personalValues.split(/[,\n]/).map(v => v.trim()).filter(v => v.length > 0)
    : [];

  const hasContent = bio || personalValues || shortTermGoals || longTermGoals;

  return (
    <div className="w-full space-y-4">
      {/* Main Sports Profile Card */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            Perfil Deportivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasContent ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Completa tu perfil deportivo para mostrar tu biografía, valores y metas.</p>
            </div>
          ) : (
            <>
              {/* Biography Section */}
              {bio && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-blue-500/10">
                      <User className="h-4 w-4 text-blue-500" />
                    </div>
                    <h4 className="font-semibold text-sm">Biografía</h4>
                  </div>
                  <div className="pl-8">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {bio}
                    </p>
                  </div>
                </div>
              )}

              {/* Personal Values Section */}
              {valueChips.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-rose-500/10">
                      <Heart className="h-4 w-4 text-rose-500" />
                    </div>
                    <h4 className="font-semibold text-sm">Valores Personales</h4>
                  </div>
                  <div className="pl-8 flex flex-wrap gap-2">
                    {valueChips.map((value, index) => (
                      <Badge
                        key={`${value}-${index}`}
                        variant="secondary"
                        className="px-3 py-1 text-sm font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 border-0"
                      >
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals Section */}
              {(shortTermGoals || longTermGoals) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-amber-500/10">
                      <Target className="h-4 w-4 text-amber-500" />
                    </div>
                    <h4 className="font-semibold text-sm">Objetivos</h4>
                  </div>
                  <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shortTermGoals && (
                      <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Target className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                            Corto Plazo (1 año)
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {shortTermGoals}
                        </p>
                      </div>
                    )}
                    {longTermGoals && (
                      <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                            Largo Plazo (3-5 años)
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {longTermGoals}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AthleteSportsProfile;
