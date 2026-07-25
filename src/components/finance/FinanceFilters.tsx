import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FinanceFiltersProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onReset: () => void;
}

const CATEGORIES = [
  { value: "escuela", label: "Escuela" },
  { value: "menores", label: "Menores" },
  { value: "transicion", label: "Transición" },
  { value: "prejuvenil", label: "Pre-Juvenil" },
  { value: "juvenil", label: "Juvenil" },
  { value: "mayores", label: "Mayores" },
];

export function FinanceFilters({ selectedCategories, onCategoriesChange, onReset }: FinanceFiltersProps) {
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const hasFilters = selectedCategories.length > 0;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Filtrar por Categoría
            </label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categorías..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <div
                    key={category.value}
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                    onClick={() => toggleCategory(category.value)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.value)}
                      onChange={() => {}}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{category.label}</span>
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpiar Filtros
            </Button>
          )}
        </div>

        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            {selectedCategories.map((category) => {
              const categoryLabel = CATEGORIES.find(c => c.value === category)?.label || category;
              return (
                <Badge
                  key={category}
                  variant="secondary"
                  className="gap-1"
                >
                  {categoryLabel}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => toggleCategory(category)}
                  />
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
