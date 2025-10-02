import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToggleButtonGroupProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface ToggleButtonProps {
  value: string
  children: React.ReactNode
  className?: string
}

const ToggleButtonGroupContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

export const ToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({
  value,
  onValueChange,
  children,
  className
}) => {
  return (
    <ToggleButtonGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn("inline-flex items-center rounded-xl bg-muted/50 p-0.5 gap-0.5", className)}>
        {children}
      </div>
    </ToggleButtonGroupContext.Provider>
  )
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  value,
  children,
  className
}) => {
  const context = React.useContext(ToggleButtonGroupContext)
  
  if (!context) {
    throw new Error("ToggleButton must be used within a ToggleButtonGroup")
  }

  const { value: selectedValue, onValueChange } = context
  const isSelected = selectedValue === value

  // Determine color variant based on value
  const getColorClasses = () => {
    if (!isSelected) {
      return "hover:bg-background/80 hover:text-foreground text-muted-foreground"
    }
    
    // Apply custom colors for specific values
    if (value === "income") {
      return "bg-green-500 text-white hover:bg-green-600"
    }
    if (value === "expense") {
      return "bg-red-500 text-white hover:bg-red-600"
    }
    
    // Default primary color for other values
    return "bg-primary text-primary-foreground hover:bg-primary/90"
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onValueChange(value)}
      className={cn(
        "rounded-xl h-9 px-4 text-sm font-medium transition-all hover:scale-100",
        isSelected && "shadow-sm",
        getColorClasses(),
        className
      )}
    >
      {children}
    </Button>
  )
}