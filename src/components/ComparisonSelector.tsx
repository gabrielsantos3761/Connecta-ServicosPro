import { useState } from 'react'
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
import { Popover } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type ComparisonType = 'previous-period' | 'previous-day' | 'previous-week' | 'previous-month' | 'same-period-last-month' | 'same-period-last-year'

interface ComparisonSelectorProps {
  comparisonType: ComparisonType
  onComparisonChange: (type: ComparisonType) => void
  className?: string
}

const comparisonOptions = [
  { value: 'previous-period' as ComparisonType, label: 'Período Anterior', description: 'Período equivalente anterior' },
  { value: 'previous-day' as ComparisonType, label: 'Dia Anterior', description: 'Comparar com ontem' },
  { value: 'previous-week' as ComparisonType, label: 'Semana Anterior', description: 'Última semana' },
  { value: 'previous-month' as ComparisonType, label: 'Mês Anterior', description: 'Mês passado' },
  { value: 'same-period-last-month' as ComparisonType, label: 'Mesmo Período Mês Anterior', description: 'Mesmo período no mês passado' },
  { value: 'same-period-last-year' as ComparisonType, label: 'Mesmo Período Ano Anterior', description: 'Mesmo período no ano passado' },
]

export function ComparisonSelector({
  comparisonType,
  onComparisonChange,
  className,
}: ComparisonSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedOption = comparisonOptions.find(opt => opt.value === comparisonType)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={
        <div className="p-3 w-80 bg-white border border-gray-200 shadow-xl rounded-lg">
          <div className="mb-3 px-2 py-1.5 bg-gray-50 rounded-md">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Comparar com</p>
          </div>
          <div className="space-y-1">
            {comparisonOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onComparisonChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg transition-all duration-200 border",
                  comparisonType === option.value
                    ? "bg-gold text-white border-gold shadow-md hover:bg-gold-dark"
                    : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
                )}
              >
                <div className={cn(
                  "font-semibold text-sm mb-0.5",
                  comparisonType === option.value ? "text-white" : "text-gray-900"
                )}>{option.label}</div>
                <div className={cn(
                  "text-xs",
                  comparisonType === option.value ? "text-white/90" : "text-gray-600"
                )}>{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      }
    >
      <button
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "0.5rem", color: "#fff", padding: "0.375rem 0.75rem",
          fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap",
        }}
        className={cn(className)}
      >
        <span>Comparar: {selectedOption?.label}</span>
        <ChevronDown size={12} />
      </button>
    </Popover>
  )
}

interface TrendIndicatorProps {
  value: number
  percentage: number
  comparisonLabel: string
  className?: string
}

export function TrendIndicator({ percentage, comparisonLabel, className }: TrendIndicatorProps) {
  const isPositive = percentage > 0
  const isNeutral = percentage === 0

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {!isNeutral && (
        isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600" />
        )
      )}
      <span className={cn(
        "text-sm font-medium",
        isPositive ? "text-green-600" : isNeutral ? "text-gray-500" : "text-red-600"
      )}>
        {isPositive && '+'}{percentage.toFixed(1)}%
      </span>
      <span className="text-xs text-gray-500">vs {comparisonLabel}</span>
    </div>
  )
}
