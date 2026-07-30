import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Clock, 
  MapPin, 
  Users, 
  Calendar,
  Edit,
  Trash2,
  Play,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes?: number;
  location?: string;
  max_athletes?: number;
  training_type: 'technical' | 'physical' | 'mental' | 'recovery' | 'gym' | 'road_skating' | 'track_skating' | 'bicycle' | 'static_bicycle' | 'simulator';
  coach_id: string;
}

interface EventModalProps {
  session: TrainingSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionUpdate: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  session,
  open,
  onOpenChange,
  onSessionUpdate
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  if (!session) return null;

  const getTrainingTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-blue-500';
      case 'physical': return 'bg-green-500';
      case 'mental': return 'bg-purple-500';
      case 'recovery': return 'bg-orange-500';
      case 'gym': return 'bg-red-500';
      case 'road_skating': return 'bg-cyan-500';
      case 'track_skating': return 'bg-indigo-500';
      case 'bicycle': return 'bg-yellow-500';
      case 'static_bicycle': return 'bg-amber-500';
      case 'simulator': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrainingTypeLabel = (type: string) => {
    switch (type) {
      case 'technical': return 'Técnico';
      case 'physical': return 'Físico';
      case 'mental': return 'Mental';
      case 'recovery': return 'Recuperación';
      case 'gym': return 'Gimnasio';
      case 'road_skating': return 'Patinaje en Ruta';
      case 'track_skating': return 'Patinaje en Pista';
      case 'bicycle': return 'Bicicleta';
      case 'static_bicycle': return 'Bicicleta Estática';
      case 'simulator': return 'Simulador';
      default: return type;
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Sesión de entrenamiento eliminada correctamente",
      });

      onSessionUpdate();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la sesión de entrenamiento",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{session.title}</span>
            <Badge 
              className={`${getTrainingTypeColor(session.training_type)} text-white`}
            >
              {getTrainingTypeLabel(session.training_type)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Fecha</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.scheduled_at), 'EEEE, d MMMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Horario</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.scheduled_at), 'HH:mm')}
                        {session.duration_minutes ? ` — ${session.duration_minutes} min` : ''}
                      </p>
                    </div>
                  </div>

                  {session.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Ubicación</p>
                        <p className="text-sm text-muted-foreground">{session.location}</p>
                      </div>
                    </div>
                  )}

                  {session.max_athletes && (
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Participantes máximos</p>
                        <p className="text-sm text-muted-foreground">{session.max_athletes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Descripción</p>
                    <p className="text-sm text-muted-foreground">
                      {session.description || 'No hay descripción disponible'}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Tipo de entrenamiento</p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm ${getTrainingTypeColor(session.training_type)}`}>
                      {getTrainingTypeLabel(session.training_type)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground">Inscritos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">0</p>
                  <p className="text-sm text-muted-foreground">Asistencias</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">0</p>
                  <p className="text-sm text-muted-foreground">Faltas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-end">
            <Button variant="outline" className="flex-1 sm:flex-none">
              <UserCheck className="h-4 w-4 mr-2" />
              Ver Asistencia
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Play className="h-4 w-4 mr-2" />
              Iniciar Sesión
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 sm:flex-none"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};