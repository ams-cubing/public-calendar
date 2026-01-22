"use client";

import React, { useState, startTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { toast } from "sonner";
import { createUltimatum } from "../_actions/ultimatum";
import { Label } from "@workspace/ui/components/label";

export function UltimatumDialog({
  competitionId,
  open,
  setOpen,
}: {
  competitionId: number;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    startTransition(async () => {
      try {
        const res = await createUltimatum({
          competitionId,
          organizerWcaId: "ORGANIZER_WCA_ID",
          deadline: new Date(deadline),
          message,
        });
        if (res?.success) {
          toast.success("Ultimátum enviado");
          setOpen(false);
        } else {
          toast.error(res?.message || "Error");
        }
      } catch {
        toast.error("Error");
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Enviar ultimátum</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Fecha límite</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
            <Label>Mensaje (opcional)</Label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose type="button">Cancelar</DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
