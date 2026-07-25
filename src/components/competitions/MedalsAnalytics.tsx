import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMedalAnalytics } from '@/hooks/useMedalRecording';
import { Trophy, TrendingUp, Medal, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const MEDAL_COLORS = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

export const MedalsAnalytics = () => {
  const { data: medals, isLoading } = useMedalAnalytics();

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>;
  }

  if (!medals || medals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medal Analytics</CardTitle>
          <CardDescription>No medal data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate statistics
  const medalCounts = medals.reduce(
    (acc, medal) => {
      acc[medal.medal_type as string] = (acc[medal.medal_type as string] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { gold: 0, silver: 0, bronze: 0, total: 0 }
  );

  // Medal distribution by competition
  const competitionData = medals.reduce((acc, medal: any) => {
    const compName = medal.competitions?.name || 'Unknown';
    if (!acc[compName]) {
      acc[compName] = { name: compName, gold: 0, silver: 0, bronze: 0 };
    }
    acc[compName][medal.medal_type as string] += 1;
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(competitionData);

  // Pie chart data
  const pieData = [
    { name: 'Gold', value: medalCounts.gold, color: MEDAL_COLORS.gold },
    { name: 'Silver', value: medalCounts.silver, color: MEDAL_COLORS.silver },
    { name: 'Bronze', value: medalCounts.bronze, color: MEDAL_COLORS.bronze },
  ].filter(item => item.value > 0);

  // Top athletes
  const athleteStats = medals.reduce((acc, medal: any) => {
    const athleteName = `${medal.athletes?.first_name} ${medal.athletes?.last_name}`;
    if (!acc[athleteName]) {
      acc[athleteName] = { name: athleteName, gold: 0, silver: 0, bronze: 0, total: 0 };
    }
    acc[athleteName][medal.medal_type as string] += 1;
    acc[athleteName].total += 1;
    return acc;
  }, {} as Record<string, any>);

  const topAthletes = Object.values(athleteStats)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Medals</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medalCounts.total}</div>
            <p className="text-xs text-muted-foreground">Across all competitions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gold Medals</CardTitle>
            <Medal className="h-4 w-4" style={{ color: MEDAL_COLORS.gold }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medalCounts.gold}</div>
            <p className="text-xs text-muted-foreground">
              {medalCounts.total > 0 ? ((medalCounts.gold / medalCounts.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Silver Medals</CardTitle>
            <Medal className="h-4 w-4" style={{ color: MEDAL_COLORS.silver }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medalCounts.silver}</div>
            <p className="text-xs text-muted-foreground">
              {medalCounts.total > 0 ? ((medalCounts.silver / medalCounts.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bronze Medals</CardTitle>
            <Medal className="h-4 w-4" style={{ color: MEDAL_COLORS.bronze }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medalCounts.bronze}</div>
            <p className="text-xs text-muted-foreground">
              {medalCounts.total > 0 ? ((medalCounts.bronze / medalCounts.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Medals by Competition</CardTitle>
            <CardDescription>Medal distribution across competitions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="gold" fill={MEDAL_COLORS.gold} name="Gold" />
                <Bar dataKey="silver" fill={MEDAL_COLORS.silver} name="Silver" />
                <Bar dataKey="bronze" fill={MEDAL_COLORS.bronze} name="Bronze" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medal Distribution</CardTitle>
            <CardDescription>Overall medal type breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Athletes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Medal Winners
          </CardTitle>
          <CardDescription>Athletes with the most medals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topAthletes.map((athlete: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                  <div>
                    <div className="font-medium">{athlete.name}</div>
                    <div className="text-sm text-muted-foreground">{athlete.total} medals</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  {athlete.gold > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: MEDAL_COLORS.gold }}>
                        {athlete.gold}
                      </div>
                      <div className="text-xs text-muted-foreground">🥇</div>
                    </div>
                  )}
                  {athlete.silver > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: MEDAL_COLORS.silver }}>
                        {athlete.silver}
                      </div>
                      <div className="text-xs text-muted-foreground">🥈</div>
                    </div>
                  )}
                  {athlete.bronze > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: MEDAL_COLORS.bronze }}>
                        {athlete.bronze}
                      </div>
                      <div className="text-xs text-muted-foreground">🥉</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
