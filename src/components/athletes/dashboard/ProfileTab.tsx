import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { User } from 'lucide-react';

interface ProfileTabProps {
  athleteData: {
    name: string;
    age: number;
    category: string;
    club: string;
    email: string;
    phone: string;
  };
}

export const ProfileTab = ({ athleteData }: ProfileTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Perfil General
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nombres y Apellidos</Label>
            <Input id="name" defaultValue={athleteData.name} />
          </div>
          <div>
            <Label htmlFor="gender">Sexo</Label>
            <Select defaultValue="M">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="age">Edad</Label>
            <Input id="age" value={athleteData.age} disabled />
          </div>
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Input id="category" value={athleteData.category} disabled />
          </div>
          <div>
            <Label htmlFor="docType">Tipo de Documento</Label>
            <Select defaultValue="TI">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                <SelectItem value="CE">Cédula de Extranjería</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="docNumber">Número de Documento</Label>
            <Input id="docNumber" placeholder="Ingresa tu número de documento" />
          </div>
        </div>
        <Separator />
        <div className="flex gap-4">
          <Button>Actualizar Información</Button>
          <Button variant="outline">Cambiar Contraseña</Button>
        </div>
      </CardContent>
    </Card>
  );
};