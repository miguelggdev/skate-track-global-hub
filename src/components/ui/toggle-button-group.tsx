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
      <div className={cn("flex items-center rounded-full bg-muted p-1", className)}>
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

  return (
    <Button
      variant={isSelected ? "toggle-primary" : "toggle-ghost"}
      size="sm"
      onClick={() => onValueChange(value)}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-all",
        isSelected && "shadow-sm",
        className
      )}
    >
      {children}
    </Button>
  )
}