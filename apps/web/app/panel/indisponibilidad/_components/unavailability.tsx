"use client";

import { useTransition } from "react";
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
import { Calendar } from "@workspace/ui/components/calendar";
import { toast } from "sonner";
import { es } from "react-day-picker/locale";
import { submitUnavailability } from "../_actions/submit-unavailability";
import { addWeeks } from "date-fns";

const unavailabilitySchema = z.object({
  dates: z.array(z.date()).min(1, "Selecciona al menos una fecha"),
});

type UnavailabilityFormValues = z.infer<typeof unavailabilitySchema>;

interface UnavailabilityFormProps {
  unavailabilityDates: { date: string }[];
}

export function UnavailabilityForm({
  unavailabilityDates,
}: UnavailabilityFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UnavailabilityFormValues>({
    resolver: zodResolver(unavailabilitySchema),
    defaultValues: {
      dates: unavailabilityDates.map((d) => {
        const [year, month, day] = d.date.split("-").map(Number);
        const date = new Date(year!, month! - 1, day);
        return date;
      }),
    },
  });

  async function onSubmit(data: UnavailabilityFormValues) {
    startTransition(async () => {
      try {
        const result = await submitUnavailability(data);

        if (result.success) {
          toast.success(
            result.message || "Indisponibilidad registrada exitosamente",
          );
          form.reset({ dates: data.dates });
        } else {
          toast.error(
            result.message || "Error al registrar la indisponibilidad",
          );
        }
      } catch {
        toast.error("Error al registrar la indisponibilidad");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="dates"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormLabel className="sr-only">
                Fechas de Indisponibilidad
              </FormLabel>
              <div className="rounded-md border p-4 bg-popover">
                <FormControl>
                  <Calendar
                    mode="multiple"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const fiveWeeksFromNow = addWeeks(today, 5);
                      return date < today || date <= fiveWeeksFromNow;
                    }}
                    locale={es}
                    numberOfMonths={2}
                    className="p-0"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground text-center">
            {form.watch("dates")?.length > 0
              ? `${form.watch("dates").length} fecha(s) seleccionada(s)`
              : "Selecciona los días que no estarás disponible"}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Guardando..." : "Registrar Indisponibilidad"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
