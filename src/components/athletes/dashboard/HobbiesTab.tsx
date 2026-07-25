import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Smile } from 'lucide-react';

export const HobbiesTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smile className="h-5 w-5" />
          Mis Hobbys
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="hobbies">Hobbys e Intereses</Label>
          <textarea 
            id="hobbies"
            className="w-full min-h-[120px] p-3 border rounded-md"
            placeholder="Cuéntanos sobre tus hobbys, intereses y actividades que te gustan fuera del patinaje..."
          />
        </div>
        <Button>Guardar Hobbys</Button>
      </CardContent>
    </Card>
  );
};