/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { CalendarIcon } from "lucide-react";
import { addMonths, addWeeks, format } from "date-fns";
import { cn } from "@workspace/ui/lib/utils";
import { submitDateRequest } from "../_actions/submit-date-request";
import { toast } from "sonner";
import { es } from "react-day-picker/locale";
import { useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";

const dateRequestSchema = z
  .object({
    city: z.string().min(2, "El nombre de la ciudad es requerido"),
    stateId: z.string().min(1, "El estado es requerido"),
    startDate: z.date({
      error: (issue) =>
        issue.input === undefined
          ? "Fecha de inicio requerida"
          : "Fecha inválida",
    }),
    endDate: z.date({
      error: (issue) =>
        issue.input === undefined ? "Fecha de fin requerida" : "Fecha inválida",
    }),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: ["endDate"],
  });

type DateRequestFormValues = z.infer<typeof dateRequestSchema>;

const MEXICAN_STATES = [
  { id: "AGU", name: "Aguascalientes" },
  { id: "BCN", name: "Baja California" },
  { id: "BCS", name: "Baja California Sur" },
  { id: "CAM", name: "Campeche" },
  { id: "CHP", name: "Chiapas" },
  { id: "CHH", name: "Chihuahua" },
  { id: "CMX", name: "Ciudad de México" },
  { id: "COA", name: "Coahuila" },
  { id: "COL", name: "Colima" },
  { id: "DUR", name: "Durango" },
  { id: "GUA", name: "Guanajuato" },
  { id: "GRO", name: "Guerrero" },
  { id: "HID", name: "Hidalgo" },
  { id: "JAL", name: "Jalisco" },
  { id: "MEX", name: "Estado de México" },
  { id: "MIC", name: "Michoacán" },
  { id: "MOR", name: "Morelos" },
  { id: "NAY", name: "Nayarit" },
  { id: "NLE", name: "Nuevo León" },
  { id: "OAX", name: "Oaxaca" },
  { id: "PUE", name: "Puebla" },
  { id: "QUE", name: "Querétaro" },
  { id: "ROO", name: "Quintana Roo" },
  { id: "SLP", name: "San Luis Potosí" },
  { id: "SIN", name: "Sinaloa" },
  { id: "SON", name: "Sonora" },
  { id: "TAB", name: "Tabasco" },
  { id: "TAM", name: "Tamaulipas" },
  { id: "TLA", name: "Tlaxcala" },
  { id: "VER", name: "Veracruz" },
  { id: "YUC", name: "Yucatán" },
  { id: "ZAC", name: "Zacatecas" },
];

export function DateRequestForm({
  availableDates,
}: {
  availableDates: Date[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = useSearchParams();

  const date = searchParams.get("fecha");

  const minDate = addMonths(new Date(), 3);
  const maxDate = addMonths(new Date(), 12);

  const initialDate = date
    ? (() => {
        const [year, month, day] = date.split("-").map(Number);
        const parsedDate = new Date(year!, month! - 1, day);

        // Validate that the date is within the allowed range and is a weekend
        const dayOfWeek = parsedDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (parsedDate < minDate || parsedDate > maxDate || !isWeekend) {
          return undefined;
        }

        return parsedDate;
      })()
    : undefined;

  const form = useForm<DateRequestFormValues>({
    resolver: zodResolver(dateRequestSchema),
    defaultValues: {
      city: "",
      stateId: "",
      startDate: initialDate,
      endDate: initialDate,
    },
  });

  async function onSubmit(data: DateRequestFormValues) {
    setIsSubmitting(true);
    try {
      const result = await submitDateRequest(data);

      if (result.success) {
        toast.success(result.message || "Solicitud enviada exitosamente");
        form.reset();
      } else {
        toast.error(result.message || "Error al enviar la solicitud");
      }
    } catch (error) {
      toast.error("Error al enviar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="flex flex-col items-start">
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Guadalajara" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stateId"
            render={({ field }) => (
              <FormItem className="flex flex-col items-start">
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MEXICAN_STATES.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormItem className="flex flex-col">
          <FormLabel>Fechas</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  data-invalid={
                    !!form.formState.errors.startDate ||
                    !!form.formState.errors.endDate
                  }
                  className={cn(
                    "w-full pl-3 text-left font-normal data-[invalid=true]:ring-2 data-[invalid=true]:ring-destructive/20 dark:data-[invalid=true]:ring-destructive/40 data-[invalid=true]:border-destructive",
                    !form.watch("startDate") && "text-muted-foreground",
                  )}
                >
                  {form.watch("startDate") && form.watch("endDate") ? (
                    <>
                      {format(form.watch("startDate"), "PPP", { locale: es })} -{" "}
                      {format(form.watch("endDate"), "PPP", { locale: es })}
                    </>
                  ) : (
                    <span>Selecciona la fecha</span>
                  )}
                  <CalendarIcon className="ml-auto opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: form.watch("startDate"),
                  to: form.watch("endDate"),
                }}
                onSelect={(range: DateRange | undefined) => {
                  if (range?.from) {
                    form.setValue("startDate", range.from);
                  }
                  if (range?.to) {
                    form.setValue("endDate", range.to);
                  }
                }}
                disabled={(date) => {
                  const day = date.getDay();
                  const isWeekend = day === 0 || day === 6;
                  const isOutOfRange = date < minDate || date > maxDate;
                  return !isWeekend || isOutOfRange;
                }}
                modifiers={{
                  unavailable: availableDates,
                }}
                modifiersClassNames={{
                  unavailable: "[&>button]:line-through opacity-100",
                }}
                autoFocus
                locale={es}
                numberOfMonths={2}
                defaultMonth={minDate}
              />
            </PopoverContent>
          </Popover>
          <FormMessage>
            {form.formState.errors.startDate?.message ||
              form.formState.errors.endDate?.message}
          </FormMessage>
        </FormItem>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
        </Button>
      </form>
    </Form>
  );
}
