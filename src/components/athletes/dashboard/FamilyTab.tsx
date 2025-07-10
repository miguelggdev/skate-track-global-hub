import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

export const FamilyTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Mi Familia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Información de Padres</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentName">Nombres y Apellidos</Label>
                <Input id="parentName" placeholder="Nombre completo del padre/madre" />
              </div>
              <div>
                <Label htmlFor="parentPhone">Teléfono</Label>
                <Input id="parentPhone" placeholder="Teléfono" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="parentEmail">Email</Label>
                <Input id="parentEmail" type="email" placeholder="Email" />
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Acudiente Autorizado</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guardianName">Nombre del Acudiente</Label>
                <Input id="guardianName" placeholder="Si es diferente a los padres" />
              </div>
              <div>
                <Label htmlFor="relationship">Parentesco</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tio">Tío/Tía</SelectItem>
                    <SelectItem value="abuelo">Abuelo/Abuela</SelectItem>
                    <SelectItem value="hermano">Hermano/Hermana</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="guardianPhone">Teléfono</Label>
                <Input id="guardianPhone" placeholder="Teléfono" />
              </div>
              <div>
                <Label htmlFor="guardianEmail">Email</Label>
                <Input id="guardianEmail" type="email" placeholder="Email" />
              </div>
            </div>
          </div>
        </div>
        <Button>Guardar Información Familiar</Button>
      </CardContent>
    </Card>
  );
};