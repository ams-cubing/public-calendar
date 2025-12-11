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

interface Competition {
  id: number;
  name: string | null;
  city: string;
  stateId: string;
  primaryDelegateId: string | null;
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
}

export function CalendarView({ competitions }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

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
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusLabel = (status: Competition["statusPublic"]) => {
    const labels = {
      open: "Abierto",
      reserved: "Reservado",
      confirmed: "Confirmado",
      announced: "Anunciado",
      suspended: "Suspendido",
      unavailable: "No disponible",
    };
    return labels[status];
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

  return (
    <>
      <div className="bg-background rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">
            {monthNames[month]} {year}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={previousMonth} size="icon" disabled={
              year === new Date().getFullYear() && month === new Date().getMonth()
            }>
              <ChevronLeft />
            </Button>
            <Button variant="outline" onClick={nextMonth} size="icon" disabled={
              year === new Date().getFullYear() + 1 && month === 11
            }>
              <ChevronRight />
            </Button>
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
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div
                key={day}
                className={cn("min-h-24 border rounded-lg p-2", isToday
                  ? "bg-blue-50 border-blue-300 dark:bg-blue-900 dark:border-blue-700"
                  : "border-slate-200 dark:border-slate-700")}
              >
                <div
                  className={cn("text-sm font-semibold mb-1", isToday
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {dayCompetitions.map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => handleCompetitionClick(comp)}
                      className="text-xs p-1 bg-slate-100 dark:bg-slate-800 rounded truncate hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
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
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-primary/10 text-primary">
                  {getStatusLabel(selectedCompetition.statusPublic)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
