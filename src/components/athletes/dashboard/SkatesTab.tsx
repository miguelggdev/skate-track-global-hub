import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap } from 'lucide-react';

export const SkatesTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Mis Patines
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold">Información de Bota</h4>
            <div>
              <Label htmlFor="bootBrand">Marca de Bota</Label>
              <Input id="bootBrand" placeholder="Ej: Bont, Luigino" />
            </div>
            <div>
              <Label htmlFor="bootSize">Número de Bota</Label>
              <Input id="bootSize" type="number" placeholder="Ej: 42" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Chasis y Ruedas</h4>
            <div>
              <Label htmlFor="frameBrand">Marca de Chasis</Label>
              <Input id="frameBrand" placeholder="Ej: Roll-Line, Atom" />
            </div>
            <div>
              <Label htmlFor="frameSize">Medidas de Chasis</Label>
              <Input id="frameSize" placeholder="Ej: 13 pulgadas" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Ruedas de Pista</h4>
            <div>
              <Label htmlFor="trackWheels">Marca de Ruedas</Label>
              <Input id="trackWheels" placeholder="Ej: Matter, Hyper" />
            </div>
            <div>
              <Label htmlFor="wheelDiameter">Diámetro</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80">80mm</SelectItem>
                  <SelectItem value="84">84mm</SelectItem>
                  <SelectItem value="90">90mm</SelectItem>
                  <SelectItem value="100">100mm</SelectItem>
                  <SelectItem value="110">110mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Equipo de Protección</h4>
            <div>
              <Label htmlFor="helmet">Marca de Casco</Label>
              <Input id="helmet" placeholder="Ej: Pro-tec, Bauer" />
            </div>
          </div>
        </div>
        <Button>Guardar Información de Equipo</Button>
      </CardContent>
    </Card>
  );
};