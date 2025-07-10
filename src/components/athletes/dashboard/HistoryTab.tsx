import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy } from 'lucide-react';

export const HistoryTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Historial de Patinaje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="previousClub">Escuela/Club Anterior</Label>
            <Input id="previousClub" placeholder="Si has pertenecido a otro club" />
          </div>
          <div>
            <Label htmlFor="yearsExperience">Años de Práctica</Label>
            <Input id="yearsExperience" type="number" placeholder="Años" />
          </div>
          <div>
            <Label htmlFor="startDate">Fecha de Inicio en el Patinaje</Label>
            <Input id="startDate" type="date" />
          </div>
          <div>
            <Label htmlFor="leagueDate">Fecha de Liga</Label>
            <Input id="leagueDate" type="date" />
          </div>
          <div>
            <Label htmlFor="federationDate">Fecha de Federación</Label>
            <Input id="federationDate" type="date" />
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="isLeague" />
            <Label htmlFor="isLeague">¿Ligado a Liga?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="isFederated" />
            <Label htmlFor="isFederated">¿Federado?</Label>
          </div>
        </div>
        
        <Button>Actualizar Historial</Button>
      </CardContent>
    </Card>
  );
};