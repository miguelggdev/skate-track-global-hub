import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Heart } from 'lucide-react';

export const BodyTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Mi Cuerpo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input id="weight" type="number" placeholder="65" />
          </div>
          <div>
            <Label htmlFor="height">Altura (cm)</Label>
            <Input id="height" type="number" placeholder="170" />
          </div>
          <div>
            <Label htmlFor="size">Talla</Label>
            <Input id="size" placeholder="M" />
          </div>
          <div>
            <Label htmlFor="bloodType">Tipo de Sangre</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <div>
            <Label htmlFor="allergies">Alergias</Label>
            <Input id="allergies" placeholder="Describe cualquier alergia conocida" />
          </div>
          <div>
            <Label htmlFor="surgeries">Cirugías</Label>
            <Input id="surgeries" placeholder="Cirugías previas" />
          </div>
          <div>
            <Label htmlFor="injuries">Lesiones</Label>
            <Input id="injuries" placeholder="Lesiones importantes" />
          </div>
          <div>
            <Label htmlFor="limitations">Limitaciones Físicas</Label>
            <Input id="limitations" placeholder="Limitaciones o restricciones" />
          </div>
        </div>
        <Button>Guardar Información Médica</Button>
      </CardContent>
    </Card>
  );
};