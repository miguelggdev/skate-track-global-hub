import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FinanceToggleButtons } from "./FinanceToggleButtons";

interface TransactionFiltersProps {
  selectedMonth: number | null;
  selectedYear: number | null;
  selectedType: string;
  onMonthChange: (month: number | null) => void;
  onYearChange: (year: number | null) => void;
  onTypeChange: (type: string) => void;
  onReset: () => void;
}

const MONTHS = [
  { value: null, label: "Todos los meses" },
  { value: 0, label: "Enero" },
  { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" },
  { value: 5, label: "Junio" },
  { value: 6, label: "Julio" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" },
  { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" },
  { value: 11, label: "Diciembre" },
];

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [{ value: null, label: "Todos los años" }];
  for (let i = 0; i <= 5; i++) {
    years.push({ value: currentYear - i, label: (currentYear - i).toString() });
  }
  return years;
};

export function TransactionFilters({
  selectedMonth,
  selectedYear,
  selectedType,
  onMonthChange,
  onYearChange,
  onTypeChange,
  onReset,
}: TransactionFiltersProps) {
  const hasFilters = selectedMonth !== null || selectedYear !== null || selectedType !== "all";
  const yearOptions = getYearOptions();

  const getMonthLabel = (month: number | null) => {
    return MONTHS.find(m => m.value === month)?.label || "Todos los meses";
  };

  const getYearLabel = (year: number | null) => {
    return year?.toString() || "Todos los años";
  };

  const getTypeLabel = (type: string) => {
    if (type === "income") return "Ingresos";
    if (type === "expense") return "Gastos";
    return "Todas";
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Month Selector */}
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Mes
              </label>
              <Select
                value={selectedMonth === null ? "all" : selectedMonth.toString()}
                onValueChange={(value) => onMonthChange(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem
                      key={month.value === null ? "all" : month.value}
                      value={month.value === null ? "all" : month.value.toString()}
                    >
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Selector */}
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Año
              </label>
              <Select
                value={selectedYear === null ? "all" : selectedYear.toString()}
                onValueChange={(value) => onYearChange(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem
                      key={year.value === null ? "all" : year.value}
                      value={year.value === null ? "all" : year.value.toString()}
                    >
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Toggle Buttons */}
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Tipo
              </label>
              <FinanceToggleButtons value={selectedType} onValueChange={onTypeChange} />
            </div>

            {/* Clear Filters Button */}
            {hasFilters && (
              <Button
                variant="outline"
                size="default"
                onClick={onReset}
                className="gap-2 h-[42px]"
              >
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {selectedMonth !== null && (
                <Badge variant="secondary" className="gap-1">
                  {getMonthLabel(selectedMonth)}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onMonthChange(null)}
                  />
                </Badge>
              )}
              {selectedYear !== null && (
                <Badge variant="secondary" className="gap-1">
                  {getYearLabel(selectedYear)}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onYearChange(null)}
                  />
                </Badge>
              )}
              {selectedType !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {getTypeLabel(selectedType)}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onTypeChange("all")}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
