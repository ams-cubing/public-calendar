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

const dateRequestSchema = z
  .object({
    city: z.string().min(2, "El nombre de la ciudad es requerido"),
    stateId: z.string().min(1, "El estado es requerido"),
    startDate: z.date(),
    endDate: z.date(),
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

export function DateRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DateRequestFormValues>({
    resolver: zodResolver(dateRequestSchema),
    defaultValues: {
      city: "",
      stateId: "",
    },
  });
  
  const minDate = addWeeks(addMonths(new Date(), 1), 1);
  const maxDate = addMonths(new Date(), 6);

  async function onSubmit(data: DateRequestFormValues) {
    setIsSubmitting(true);
    try {
      const result = await submitDateRequest(data);

      console.log("Result:", result);

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
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <FormControl>
                <Input placeholder="Guadalajara" {...field} />
              </FormControl>
              <FormDescription>
                Ciudad donde se realizará la competencia
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
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
              <FormDescription>
                El delegado será asignado automáticamente según el estado
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de Inicio</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < minDate ||
                      date > maxDate
                    }
                    autoFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de Fin</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < minDate ||
                      date > maxDate
                    }
                    autoFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
        </Button>
      </form>
    </Form>
  );
}
