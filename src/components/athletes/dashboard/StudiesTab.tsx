import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap } from 'lucide-react';

export const StudiesTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Mis Estudios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="educationLevel">Nivel Educativo</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primaria">Primaria</SelectItem>
                <SelectItem value="secundaria">Secundaria</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="universitario">Universitario</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="currentGrade">Curso Actual</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(11)].map((_, i) => (
                  <SelectItem key={i+1} value={`${i+1}`}>{i+1}°</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="school">Institución educativa Actual</Label>
            <Input id="school" placeholder="Nombre de la institución educativa" />
          </div>
          <div>
            <Label htmlFor="schoolAddress">Dirección de la Institución educativa</Label>
            <Input id="schoolAddress" placeholder="Dirección" />
          </div>
          <div>
            <Label htmlFor="schoolPhone">Teléfono de la Institución educativa</Label>
            <Input id="schoolPhone" placeholder="Teléfono" />
          </div>
          <div>
            <Label htmlFor="schoolEmail">Correo de la Institución educativa</Label>
            <Input id="schoolEmail" type="email" placeholder="Email" />
          </div>
        </div>
        <Button>Guardar Información Académica</Button>
      </CardContent>
    </Card>
  );
};