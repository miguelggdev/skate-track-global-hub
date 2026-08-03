import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { useAthletes } from '@/hooks/useAthletes';
import { useAttendanceManagement } from '@/hooks/useAttendanceManagement';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, User, Loader2, AlertTriangle } from 'lucide-react';

interface AttendanceRecord {
  athlete_id: string;
  attended: boolean;
}

export default function QuickAttendanceRegistration() {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [attendanceStates, setAttendanceStates] = useState<{[key: string]: boolean | null}>({});
  
  const { toast } = useToast();
  const { profile, loading: profileLoading, isAdmin, isCoach, isDelegate } = useUserProfile();
  const { trainingSessions, isLoading: sessionsLoading } = useTrainingSessions({ 
    includeCoachInfo: true,
    dateFilter: 'upcoming' 
  });
  const { data: athletes = [], isLoading: athletesLoading } = useAthletes();
  const { registerAttendance, isRegistering, canRegisterAttendance } = useAttendanceManagement();

  // Auto-select first upcoming session
  useEffect(() => {
    if (!sessionsLoading && trainingSessions.length > 0 && !selectedSessionId) {
      const upcomingSessions = trainingSessions.filter(session =>
        new Date(session.scheduled_at) >= new Date()
      ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      
      if (upcomingSessions.length > 0) {
        setSelectedSessionId(upcomingSessions[0].id);
      }
    }
  }, [sessionsLoading, trainingSessions, selectedSessionId]);

  // Fetch existing attendance for selected session
  const { data: existingAttendance = [] } = useQuery({
    queryKey: ['session-attendance', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return [];
      const { data, error } = await supabase
        .from('training_attendance')
        .select('athlete_id, attended')
        .eq('training_session_id', selectedSessionId);
      
      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!selectedSessionId,
  });

  // Filter athletes based on search and category
  const filteredAthletes = useMemo(() => {
    let filtered = athletes;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(athlete => athlete.category === categoryFilter);
    }
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(athlete => 
        `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [athletes, categoryFilter, searchTerm]);

  // Get current attendance status for each athlete
  const getAttendanceStatus = (athleteId: string): boolean | null => {
    // First check local state
    if (attendanceStates[athleteId] !== undefined) {
      return attendanceStates[athleteId];
    }
    // Then check existing attendance from database
    const existing = existingAttendance.find(a => a.athlete_id === athleteId);
    return existing ? existing.attended : null;
  };

  const handleAttendanceClick = async (athleteId: string, attended: boolean) => {
    if (!selectedSessionId) {
      toast({
        title: 'Error',
        description: 'Please select a training session first',
        variant: 'destructive',
      });
      return;
    }

    // Optimistic update
    setAttendanceStates(prev => ({
      ...prev,
      [athleteId]: attended
    }));

    try {
      await registerAttendance({
        training_session_id: selectedSessionId,
        athlete_id: athleteId,
        attended,
      });
    } catch (error) {
      // Revert optimistic update on error
      setAttendanceStates(prev => ({
        ...prev,
        [athleteId]: getAttendanceStatus(athleteId)
      }));
    }
  };

  const selectedSession = trainingSessions.find(s => s.id === selectedSessionId);
  const attendanceCount = filteredAthletes.filter(athlete => 
    getAttendanceStatus(athlete.id) === true
  ).length;

  // Show loading while profile is being fetched
  if (profileLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold">Loading...</h3>
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check permissions with detailed feedback
  if (!canRegisterAttendance()) {
    const hasAnyRole = isAdmin || isCoach || isDelegate;
    const userRole = profile?.role;
    
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              You need admin, coach, or delegate permissions to register attendance.
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Current role: <span className="font-mono">{userRole || 'None'}</span></p>
              <p>Required roles: admin, coach, or delegate</p>
              {!profile && <p className="text-orange-600">Profile not loaded</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Training Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="session-select">Training Session</Label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger id="session-select">
                  <SelectValue placeholder="Choose a training session..." />
                </SelectTrigger>
                <SelectContent>
                  {sessionsLoading ? (
                    <SelectItem value="loading" disabled>Loading sessions...</SelectItem>
                  ) : trainingSessions.length === 0 ? (
                    <SelectItem value="none" disabled>No upcoming sessions</SelectItem>
                  ) : (
                    trainingSessions.map(session => (
                      <SelectItem key={session.id} value={session.id}>
                        {format(new Date(session.scheduled_at), 'MMM dd, yyyy HH:mm')} - {session.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedSession && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(selectedSession.scheduled_at), 'HH:mm')}
                    {' '}({selectedSession.duration_minutes ?? 60} min)
                  </span>
                  <Badge variant="secondary">{selectedSession.training_type}</Badge>
                </div>
                {selectedSession.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedSession.location}</span>
                  </div>
                )}
                {selectedSession.description && (
                  <p className="text-sm text-muted-foreground">{selectedSession.description}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Athletes Section */}
      {selectedSessionId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Athletes
              </div>
              <Badge variant="outline">
                {attendanceCount} / {filteredAthletes.length} Present
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search">Search Athletes</Label>
                  <Input
                    id="search"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="escuela">Escuela</SelectItem>
                      <SelectItem value="menores">Menores</SelectItem>
                      <SelectItem value="transicion">Transición</SelectItem>
                      <SelectItem value="prejuvenil">Prejuvenil</SelectItem>
                      <SelectItem value="juvenil">Juvenil</SelectItem>
                      <SelectItem value="mayores">Mayores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Athletes List */}
              {athletesLoading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading athletes...</div>
                </div>
              ) : filteredAthletes.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground">No athletes found</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAthletes.map(athlete => {
                    const attendanceStatus = getAttendanceStatus(athlete.id);
                    const isPresent = attendanceStatus === true;
                    const isAbsent = attendanceStatus === false;
                    
                    return (
                      <div
                        key={athlete.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {athlete.first_name} {athlete.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {athlete.category} • {athlete.level}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={isPresent ? "default" : "outline"}
                            onClick={() => handleAttendanceClick(athlete.id, true)}
                            disabled={isRegistering}
                            className={isPresent ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Present
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={isAbsent ? "destructive" : "outline"}
                            onClick={() => handleAttendanceClick(athlete.id, false)}
                            disabled={isRegistering}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}