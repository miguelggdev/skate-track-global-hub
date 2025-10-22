import { cn } from "@/lib/utils";

interface FinanceToggleButtonsProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function FinanceToggleButtons({ value, onValueChange }: FinanceToggleButtonsProps) {
  return (
    <div className="inline-flex gap-2">
      <button
        onClick={() => onValueChange("all")}
        className={cn(
          "w-[130px] h-[42px] rounded-md font-semibold text-sm transition-all",
          "inline-flex items-center justify-center",
          value === "all"
            ? "bg-muted text-foreground"
            : "bg-background text-muted-foreground border border-border hover:bg-muted/50"
        )}
      >
        Todas
      </button>
      <button
        onClick={() => onValueChange("income")}
        className={cn(
          "w-[130px] h-[42px] rounded-md font-semibold text-sm transition-all",
          "inline-flex items-center justify-center",
          value === "income"
            ? "text-white shadow-sm"
            : "bg-background text-muted-foreground border border-border hover:opacity-80"
        )}
        style={value === "income" ? { backgroundColor: "#00bcd4" } : undefined}
      >
        Ingresos
      </button>
      <button
        onClick={() => onValueChange("expense")}
        className={cn(
          "w-[130px] h-[42px] rounded-md font-semibold text-sm transition-all",
          "inline-flex items-center justify-center",
          value === "expense"
            ? "text-white shadow-sm"
            : "bg-background text-muted-foreground border border-border hover:opacity-80"
        )}
        style={value === "expense" ? { backgroundColor: "#1a22ff" } : undefined}
      >
        Gastos
      </button>
    </div>
  );
}
