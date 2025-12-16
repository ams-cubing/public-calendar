"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Textarea } from "@workspace/ui/components/textarea";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";
import { es } from "react-day-picker/locale";
import type { DateRange } from "react-day-picker";
import { submitUnavailability } from "../_actions/submit-unavailability";

const unavailabilitySchema = z
  .object({
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
    note: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: ["endDate"],
  });

type UnavailabilityFormValues = z.infer<typeof unavailabilitySchema>;

export function UnavailabilityForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UnavailabilityFormValues>({
    resolver: zodResolver(unavailabilitySchema),
    defaultValues: {
      note: "",
    },
  });

  async function onSubmit(data: UnavailabilityFormValues) {
    setIsSubmitting(true);
    try {
      const result = await submitUnavailability(data);

      if (result.success) {
        toast.success(
          result.message || "Indisponibilidad registrada exitosamente",
        );
        form.reset();
      } else {
        toast.error(result.message || "Error al registrar la indisponibilidad");
      }
    } catch {
      toast.error("Error al registrar la indisponibilidad");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormItem className="flex flex-col">
          <FormLabel>Período de Indisponibilidad</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !form.watch("startDate") && "text-muted-foreground",
                  )}
                >
                  {form.watch("startDate") && form.watch("endDate") ? (
                    form.watch("startDate").getTime() ===
                    form.watch("endDate").getTime() ? (
                      format(form.watch("startDate"), "PPP", { locale: es })
                    ) : (
                      <>
                        {format(form.watch("startDate"), "PPP", { locale: es })}{" "}
                        - {format(form.watch("endDate"), "PPP", { locale: es })}
                      </>
                    )
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                    // If only one date is selected, set endDate to the same date
                    form.setValue("endDate", range.to || range.from);
                  }
                }}
                disabled={(date) => date < new Date()}
                autoFocus
                locale={es}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <FormMessage>
            {form.formState.errors.startDate?.message ||
              form.formState.errors.endDate?.message}
          </FormMessage>
        </FormItem>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nota</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Razón de la indisponibilidad..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Registrar Indisponibilidad"}
        </Button>
      </form>
    </Form>
  );
}
