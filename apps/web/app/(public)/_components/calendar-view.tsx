"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { useRouter } from "next/navigation";
import { addMonths } from "date-fns";
import { getPublicStatusColor, formatPublicStatus } from "@/lib/utils";
import type { Holiday } from "@/db/schema";

interface Competition {
  id: number;
  name: string | null;
  city: string;
  stateId: string;
  requestedBy: string | null;
  trelloUrl: string | null;
  startDate: string;
  endDate: string;
  statusPublic:
  | "open"
  | "reserved"
  | "confirmed"
  | "announced"
  | "suspended"
  | "unavailable";
  statusInternal: "draft" | "looking_for_venue" | "ultimatum_sent" | "ready";
  createdAt: Date;
  updatedAt: Date;
  state: {
    id: string;
    name: string;
    regionId: string;
    region: {
      id: string;
      displayName: string;
      mapColor: string;
    };
  };
}

interface CalendarViewProps {
  competitions: Competition[];
  holidays: Holiday[];
}

export function CalendarView({ competitions, holidays }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 3, 1);
  });
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

  const minDate = addMonths(new Date(), 3);
  const maxDate = addMonths(new Date(), 12);

  // Add this helper function
  const getHolidayForDay = (day: number) => {
    return holidays.find((holiday) => {
      const holidayDate = new Date(holiday.date);
      return (
        holidayDate.getDate() === day &&
        holidayDate.getMonth() === month &&
        holidayDate.getFullYear() === year
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getCompetitionsForDay = (day: number) => {
    const date = new Date(year, month, day);
    const dateStart = new Date(date.setHours(0, 0, 0, 0));
    const dateEnd = new Date(date.setHours(23, 59, 59, 999));

    return competitions.filter((comp) => {
      const [startYear, startMonth, startDay] = comp.startDate
        .split("-")
        .map(Number);
      const [endYear, endMonth, endDay] = comp.endDate.split("-").map(Number);

      const startDate = new Date(startYear!, startMonth! - 1, startDay);
      const endDate = new Date(endYear!, endMonth! - 1, endDay);

      return dateStart <= endDate && dateEnd >= startDate;
    });
  };

  const handleCompetitionClick = (competition: Competition) => {
    setSelectedCompetition(competition);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year!, month! - 1, day);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(year, month, day);
    return date < minDate || date > maxDate;
  };

  const handleDayClick = (day: number) => {
    if (isDateDisabled(day)) return;

    const date = new Date(year, month, day);
    const formattedDate = date.toISOString().split("T")[0];
    router.push(`/solicitar-fecha?fecha=${formattedDate}`);
  };

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 3;

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth() + 3, 1));
  };

  return (
    <>
      <div className="bg-background">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">
            {monthNames[month]} {year}
          </h2>
          <div className="flex gap-4">
            {!isCurrentMonth && (
              <Button
                onClick={goToToday}
              >
                <Calendar />
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={previousMonth}
                size="icon"
                disabled={
                  year === new Date().getFullYear() &&
                  month === new Date().getMonth()
                }
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                onClick={nextMonth}
                size="icon"
                disabled={year === new Date().getFullYear() + 1 && month === 11}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 sm:gap-2 gap-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-sm text-muted-foreground pb-2"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-24" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayCompetitions = getCompetitionsForDay(day);
            const holiday = getHolidayForDay(day);
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();
            const disabled = isDateDisabled(day);

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "min-h-24 border rounded-lg p-2 transition-colors",
                  disabled
                    ? "cursor-not-allowed opacity-50 bg-slate-50 dark:bg-slate-900"
                    : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800",
                  isToday
                    ? "bg-blue-50 border-blue-300 dark:bg-blue-900 dark:border-blue-700"
                    : "border-slate-200 dark:border-slate-700",
                  holiday && "bg-red-50 dark:bg-red-950",
                )}
              >
                <div
                  className={cn(
                    "text-sm font-semibold mb-1",
                    disabled && !isToday && "text-muted-foreground",
                    isToday
                      ? "text-blue-600 dark:text-blue-400"
                      : !disabled && "text-slate-700 dark:text-slate-300",
                  )}
                >
                  {day}
                </div>
                {holiday && (
                  <div
                    className="text-xs text-red-600 dark:text-red-400 font-medium mb-1 truncate"
                    title={holiday.name}
                  >
                    {holiday.name}
                  </div>
                )}
                <div className="space-y-1">
                  {dayCompetitions.map((comp) => (
                    <div
                      key={comp.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompetitionClick(comp);
                      }}
                      className={cn(
                        "text-xs p-1 rounded truncate cursor-pointer transition-colors",
                        getPublicStatusColor(comp.statusPublic),
                      )}
                      title={`Competencia en ${comp.state.region.displayName}`}
                    >
                      Competencia en {comp.state.region.displayName}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Competencia en {selectedCompetition?.state.region.displayName}
            </DialogTitle>
            <DialogDescription>Detalles de la competencia</DialogDescription>
          </DialogHeader>

          {selectedCompetition && (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Fechas</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedCompetition.startDate)}
                    {selectedCompetition.startDate !==
                      selectedCompetition.endDate && (
                        <> - {formatDate(selectedCompetition.endDate)}</>
                      )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Ubicación</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCompetition.state.region.displayName}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-1">Estado</p>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    getPublicStatusColor(selectedCompetition.statusPublic),
                  )}
                >
                  {formatPublicStatus(selectedCompetition.statusPublic)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
