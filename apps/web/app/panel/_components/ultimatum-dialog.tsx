"use client";

import React, { useState, useTransition } from "react";
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
import { sendUltimatum } from "../_actions/ultimatum";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";

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
  const [pending, startTransition] = useTransition();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await sendUltimatum({
          competitionId,
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
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <form onSubmit={onSubmit}>
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
            <Label>Mensaje</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose type="button" asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
