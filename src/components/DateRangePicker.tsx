import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

export type DateRange = { from?: Date; to?: Date }

interface DateRangePickerProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  className?: string
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const formatDateRange = () => {
    if (!dateRange.from) return "Selecione o período"
    if (!dateRange.to) return formatDate(dateRange.from)
    return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={
        <div style={{ background: "#0a0900", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", padding: 0 }}>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(range) => {
              onDateRangeChange(range as { from?: Date; to?: Date })
              if (range && (range as { from?: Date; to?: Date }).to) {
                setOpen(false)
              }
            }}
            numberOfMonths={1}
            className="text-white"
          />
        </div>
      }
    >
      <button
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "0.5rem", color: dateRange.from ? "#fff" : "rgba(255,255,255,0.4)",
          padding: "0.5rem 0.875rem", fontSize: "0.875rem", cursor: "pointer", whiteSpace: "nowrap",
        }}
        className={cn(className)}
      >
        <CalendarIcon size={14} />
        {formatDateRange()}
      </button>
    </Popover>
  )
}
