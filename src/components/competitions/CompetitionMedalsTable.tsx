import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Medal, Trash2, Trophy } from 'lucide-react';
import { useCompetitionMedals, useMedalRecording } from '@/hooks/useMedalRecording';

interface CompetitionMedalsTableProps {
  competitionId: string;
}

export const CompetitionMedalsTable = ({ competitionId }: CompetitionMedalsTableProps) => {
  const { data: medals, isLoading } = useCompetitionMedals(competitionId);
  const { deleteMedal } = useMedalRecording();

  const getMedalBadge = (medalType: string) => {
    const variants = {
      gold: { emoji: '🥇', variant: 'default' as const, color: 'bg-yellow-500/10 text-yellow-600' },
      silver: { emoji: '🥈', variant: 'secondary' as const, color: 'bg-gray-400/10 text-gray-600' },
      bronze: { emoji: '🥉', variant: 'outline' as const, color: 'bg-orange-500/10 text-orange-600' },
    };
    const medal = variants[medalType as keyof typeof variants] || variants.bronze;
    return (
      <Badge className={medal.color}>
        {medal.emoji} {medalType.toUpperCase()}
      </Badge>
    );
  };

  const formatTime = (seconds: number | null | undefined) => {
    if (seconds == null) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2).padStart(5, '0');
    return mins > 0 ? `${mins}:${secs}` : `${secs}s`;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading medals...</div>;
  }

  if (!medals || medals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Competition Medals
          </CardTitle>
          <CardDescription>No medals recorded yet for this competition</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const medalCounts = medals.reduce(
    (acc, medal) => {
      acc[medal.medal_type as string] = (acc[medal.medal_type as string] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Competition Medals
            </CardTitle>
            <CardDescription>
              {medals.length} medals recorded
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {medalCounts.gold && (
              <Badge className="bg-yellow-500/10 text-yellow-600">
                🥇 {medalCounts.gold}
              </Badge>
            )}
            {medalCounts.silver && (
              <Badge className="bg-gray-400/10 text-gray-600">
                🥈 {medalCounts.silver}
              </Badge>
            )}
            {medalCounts.bronze && (
              <Badge className="bg-orange-500/10 text-orange-600">
                🥉 {medalCounts.bronze}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Athlete</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Medal</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medals.map((medal: any) => (
              <TableRow key={medal.id}>
                <TableCell className="font-medium">
                  {medal.athletes?.first_name} {medal.athletes?.last_name}
                  <div className="text-xs text-muted-foreground">
                    {medal.athletes?.category} - {medal.athletes?.gender}
                  </div>
                </TableCell>
                <TableCell>{medal.event_name || '-'}</TableCell>
                <TableCell>{getMedalBadge(medal.medal_type)}</TableCell>
                <TableCell className="font-mono text-sm">
                  {formatTime(medal.time_seconds)}
                </TableCell>
                <TableCell>
                  {medal.position ? `#${medal.position}` : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMedal.mutate(medal.id)}
                    disabled={deleteMedal.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
