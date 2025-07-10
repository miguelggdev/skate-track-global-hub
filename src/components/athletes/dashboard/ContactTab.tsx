import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface ContactTabProps {
  athleteData: {
    name: string;
    age: number;
    category: string;
    club: string;
    email: string;
    phone: string;
  };
}

export const ContactTab = ({ athleteData }: ContactTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Mi Contacto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="birthPlace">Lugar de Nacimiento</Label>
            <Input id="birthPlace" placeholder="Ciudad, País" />
          </div>
          <div>
            <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
            <Input id="birthDate" type="date" />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" defaultValue={athleteData.phone} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={athleteData.email} />
          </div>
          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" placeholder="Dirección completa" />
          </div>
          <div>
            <Label htmlFor="neighborhood">Barrio</Label>
            <Input id="neighborhood" placeholder="Barrio" />
          </div>
          <div>
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" placeholder="Ciudad" />
          </div>
          <div>
            <Label htmlFor="country">País</Label>
            <Select defaultValue="CO">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CO">Colombia</SelectItem>
                <SelectItem value="US">Estados Unidos</SelectItem>
                <SelectItem value="MX">México</SelectItem>
                <SelectItem value="ES">España</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button>Actualizar Contacto</Button>
      </CardContent>
    </Card>
  );
};