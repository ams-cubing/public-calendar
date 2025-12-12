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
import { createCompetition } from "../_actions/create-competition";
import { updateCompetition } from "../_actions/update-competition";
import { toast } from "sonner";
import { es } from "react-day-picker/locale";
import { useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { useRouter } from "next/navigation";

const dateRequestSchema = z
  .object({
    name: z
      .string()
      .min(2, "El nombre de la competencia es requerido")
      .optional()
      .or(z.literal("")),
    city: z.string().min(2, "El nombre de la ciudad es requerido"),
    stateId: z.string().min(1, "El estado es requerido"),
    startDate: z.date(),
    endDate: z.date(),
    trelloUrl: z.url("URL inválida").optional().or(z.literal("")),
    statusPublic: z.enum([
      "open",
      "reserved",
      "confirmed",
      "announced",
      "suspended",
      "unavailable",
    ]),
    statusInternal: z.enum([
      "draft",
      "looking_for_venue",
      "ultimatum_sent",
      "ready",
    ]),
    delegateWcaIds: z
      .array(z.string())
      .min(1, "Selecciona al menos un delegado"),
    primaryDelegateWcaId: z.string().min(1, "Selecciona un delegado principal"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: ["endDate"],
  })
  .refine((data) => data.delegateWcaIds.includes(data.primaryDelegateWcaId), {
    message: "El delegado principal debe estar en la lista de delegados",
    path: ["primaryDelegateWcaId"],
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

const PUBLIC_STATUSES = [
  { value: "open", label: "Abierto" },
  { value: "reserved", label: "Reservado" },
  { value: "confirmed", label: "Confirmado" },
  { value: "announced", label: "Anunciado" },
  { value: "suspended", label: "Suspendido" },
  { value: "unavailable", label: "No disponible" },
];

const INTERNAL_STATUSES = [
  { value: "draft", label: "Borrador" },
  { value: "looking_for_venue", label: "Buscando sede" },
  { value: "ultimatum_sent", label: "Ultimátum enviado" },
  { value: "ready", label: "Listo" },
];

type Competition = {
  id: number;
  name: string | null;
  city: string;
  stateId: string;
  startDate: string;
  endDate: string;
  trelloUrl: string | null;
  statusPublic:
    | "open"
    | "reserved"
    | "confirmed"
    | "announced"
    | "suspended"
    | "unavailable";
  statusInternal: "draft" | "looking_for_venue" | "ultimatum_sent" | "ready";
  delegates: Array<{
    delegateWcaId: string;
    isPrimary: boolean;
  }>;
};

export function CompetitionForm({
  unavailableDates,
  delegates,
  competition,
}: {
  unavailableDates: Date[];
  delegates: Array<{ wcaId: string; name: string; regionId: string | null }>;
  competition?: Competition;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!competition;

  const searchParams = useSearchParams();
  const date = searchParams.get("fecha");

  const minDate = addWeeks(new Date(), 5);
  const maxDate = addMonths(new Date(), 6);

  const router = useRouter();

  const initialDate = date
    ? (() => {
        const [year, month, day] = date.split("-").map(Number);
        const parsedDate = new Date(year!, month! - 1, day);

        if (parsedDate < minDate || parsedDate > maxDate) {
          return undefined;
        }

        return parsedDate;
      })()
    : undefined;

  const form = useForm<DateRequestFormValues>({
    resolver: zodResolver(dateRequestSchema),
    defaultValues: competition
      ? {
          name: competition.name || "",
          city: competition.city,
          stateId: competition.stateId,
          startDate: new Date(competition.startDate),
          endDate: new Date(competition.endDate),
          trelloUrl: competition.trelloUrl || "",
          statusPublic: competition.statusPublic,
          statusInternal: competition.statusInternal,
          delegateWcaIds: competition.delegates.map((d) => d.delegateWcaId),
          primaryDelegateWcaId:
            competition.delegates.find((d) => d.isPrimary)?.delegateWcaId || "",
        }
      : {
          name: "",
          city: "",
          stateId: undefined,
          startDate: initialDate,
          endDate: initialDate,
          trelloUrl: "",
          statusPublic: "reserved",
          statusInternal: "draft",
          delegateWcaIds: [],
          primaryDelegateWcaId: "",
        },
  });

  async function onSubmit(data: DateRequestFormValues) {
    setIsSubmitting(true);
    try {
      const result = isEditing
        ? await updateCompetition(competition.id, data)
        : await createCompetition(data);

      if (result.success) {
        toast.success(
          result.message ||
            `Competencia ${isEditing ? "actualizada" : "creada"} exitosamente`,
        );

        router.push("/panel");
      } else {
        toast.error(
          result.message ||
            `Error al ${isEditing ? "actualizar" : "crear"} la competencia`,
        );
      }
    } catch (error) {
      toast.error(
        `Error al ${isEditing ? "actualizar" : "crear"} la competencia`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la competencia (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Guadalajara Open 2025" {...field} />
              </FormControl>
              <FormDescription>
                Déjalo en blanco si aún no tienes un nombre
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
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
              <FormItem>
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
                disabled={(date) =>
                  !isEditing && (date < minDate || date > maxDate)
                }
                modifiers={{
                  unavailable: unavailableDates,
                }}
                modifiersClassNames={{
                  unavailable: "[&>button]:line-through opacity-100",
                }}
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
          name="trelloUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de Trello (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://trello.com/b/..."
                  type="url"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="statusPublic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado público</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PUBLIC_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="statusInternal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado interno</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INTERNAL_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="delegateWcaIds"
          render={() => (
            <FormItem>
              <FormLabel>Delegados</FormLabel>
              <FormDescription>
                Selecciona uno o más delegados para esta competencia
              </FormDescription>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {delegates.map((delegate) => (
                  <FormField
                    key={delegate.wcaId}
                    control={form.control}
                    name="delegateWcaIds"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(delegate.wcaId)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              if (checked) {
                                field.onChange([...value, delegate.wcaId]);
                              } else {
                                field.onChange(
                                  value.filter((id) => id !== delegate.wcaId),
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {delegate.name} ({delegate.wcaId})
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryDelegateWcaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delegado principal</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el delegado principal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {form
                    .watch("delegateWcaIds")
                    ?.map((wcaId) => delegates.find((d) => d.wcaId === wcaId))
                    .filter(Boolean)
                    .map((delegate) => (
                      <SelectItem key={delegate!.wcaId} value={delegate!.wcaId}>
                        {delegate!.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Debe ser uno de los delegados seleccionados arriba
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? isEditing
              ? "Actualizando..."
              : "Creando..."
            : isEditing
              ? "Actualizar Competencia"
              : "Crear Competencia"}
        </Button>
      </form>
    </Form>
  );
}
