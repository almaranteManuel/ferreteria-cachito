import * as React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const parseDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate();

export const DatePicker: React.FC<DatePickerProps> = ({
  id,
  value,
  onChange,
  className,
  placeholder = 'Seleccionar fecha',
}) => {
  const selectedDate = parseDate(value);
  const [open, setOpen] = React.useState(false);
  const [visibleMonth, setVisibleMonth] = React.useState(() => {
    const date = selectedDate ?? new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDay = (new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  ).getDay() + 6) % 7;
  const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );

  const moveMonth = (offset: number) => {
    setVisibleMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const selectDate = (day: number) => {
    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    onChange(formatDate(date));
    setOpen(false);
  };

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('es-AR')
    : placeholder;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        id={id}
        type="button"
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input',
          'bg-transparent px-3 py-1 text-left text-sm outline-none transition-colors',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          !selectedDate && 'text-muted-foreground',
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          if (!open && selectedDate) {
            setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
          }
          setOpen((current) => !current);
        }}
      >
        <span>{displayValue}</span>
        <CalendarDays className="size-4 text-muted-foreground" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Calendario"
          className="absolute left-0 z-50 mt-2 w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Mes anterior"
              onClick={() => moveMonth(-1)}
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm font-medium">
              {MONTHS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Mes siguiente"
              onClick={() => moveMonth(1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} className="size-8" />;
              const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
              const selected = selectedDate ? isSameDay(date, selectedDate) : false;
              return (
                <button
                  key={day}
                  type="button"
                  className={cn(
                    'size-8 rounded-md text-sm hover:bg-muted',
                    selected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                  aria-label={date.toLocaleDateString('es-AR')}
                  aria-pressed={selected}
                  onClick={() => selectDate(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
