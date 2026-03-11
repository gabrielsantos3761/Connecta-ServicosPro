import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type CalendarProps = {
  mode?: "single" | "range"
  selected?: Date | { from?: Date; to?: Date }
  onSelect?: (date: Date | { from?: Date; to?: Date } | undefined) => void
  className?: string
  numberOfMonths?: number
  disabled?: (date: Date) => boolean
}

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  className,
  disabled,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"]

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)

    if (mode === "single") {
      onSelect?.(clickedDate)
    } else if (mode === "range") {
      const range = selected as { from?: Date; to?: Date } | undefined

      if (!range?.from || (range.from && range.to)) {
        onSelect?.({ from: clickedDate, to: undefined })
      } else {
        if (clickedDate < range.from) {
          onSelect?.({ from: clickedDate, to: range.from })
        } else {
          onSelect?.({ from: range.from, to: clickedDate })
        }
      }
    }
  }

  const isSelected = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)

    if (mode === "single") {
      const selectedDate = selected as Date | undefined
      return selectedDate?.toDateString() === date.toDateString()
    } else {
      const range = selected as { from?: Date; to?: Date } | undefined
      if (!range?.from) return false

      const dateTime = date.getTime()
      const fromTime = range.from.getTime()
      const toTime = range.to?.getTime()

      if (toTime) {
        return dateTime >= fromTime && dateTime <= toTime
      }
      return range.from.toDateString() === date.toDateString()
    }
  }

  const isRangeStart = (day: number) => {
    if (mode !== "range") return false
    const range = selected as { from?: Date; to?: Date } | undefined
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return range?.from?.toDateString() === date.toDateString()
  }

  const isRangeEnd = (day: number) => {
    if (mode !== "range") return false
    const range = selected as { from?: Date; to?: Date } | undefined
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return range?.to?.toDateString() === date.toDateString()
  }

  const isToday = (day: number) => {
    const today = new Date()
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return today.toDateString() === date.toDateString()
  }

  const isPastDate = (day: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return date < today
  }

  const renderDays = () => {
    const days = []
    const totalDays = daysInMonth(currentDate)
    const firstDay = firstDayOfMonth(currentDate)

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />)
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const selected = isSelected(day)
      const rangeStart = isRangeStart(day)
      const rangeEnd = isRangeEnd(day)
      const today = isToday(day)
      const past = isPastDate(day)
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const isDisabled = past || (disabled ? disabled(dateObj) : false)

      days.push(
        <button
          key={day}
          onClick={() => !isDisabled && handleDateClick(day)}
          disabled={isDisabled}
          className={cn(
            "w-9 h-9 text-sm rounded-full flex items-center justify-center transition-all duration-200 font-medium",
            // Default state
            !selected && !today && !isDisabled && "text-white hover:bg-gold/20 hover:text-gold",
            // Today highlight
            today && !selected && !isDisabled && "bg-gold/20 text-gold border border-gold/50",
            // Selected state
            selected && "bg-gradient-to-br from-gold to-yellow-600 text-black shadow-lg shadow-gold/30",
            // Disabled dates
            isDisabled && "text-gray-600 cursor-not-allowed opacity-50",
            // Range styles
            rangeStart && "rounded-r-none",
            rangeEnd && "rounded-l-none",
            selected && !rangeStart && !rangeEnd && mode === "range" && "rounded-none"
          )}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div className={cn(
      "p-5 rounded-2xl border border-gold/30 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl shadow-2xl shadow-gold/10",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={previousMonth}
          className="h-9 w-9 rounded-full bg-white/5 hover:bg-gold/20 text-gray-400 hover:text-gold transition-all border border-white/10 hover:border-gold/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <h3 className="font-bold text-base bg-gradient-to-r from-gold to-yellow-500 bg-clip-text text-transparent">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          className="h-9 w-9 rounded-full bg-white/5 hover:bg-gold/20 text-gray-400 hover:text-gold transition-all border border-white/10 hover:border-gold/50"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {dayNames.map((name, index) => (
          <div
            key={`${name}-${index}`}
            className={cn(
              "text-xs text-center font-semibold p-2",
              index === 0 || index === 6 ? "text-gold/70" : "text-gray-500"
            )}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-3" />

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>

      {/* Footer legend */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gold/20 border border-gold/50" />
          <span className="text-gray-500">Hoje</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gold to-yellow-600" />
          <span className="text-gray-500">Selecionado</span>
        </div>
      </div>
    </div>
  )
}
