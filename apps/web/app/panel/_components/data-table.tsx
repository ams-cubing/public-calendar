"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, Pencil } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { AvatarGroup } from "@workspace/ui/components/avatar-group";
import {
  getPublicStatusColor,
  formatPublicStatus,
  formatInternalStatus,
  getInternalStatusColor,
} from "@/lib/utils";
import { cn } from "@workspace/ui/lib/utils";
import { buttonVariants } from "@workspace/ui/components/button";
import type {
  CompetitionDelegate,
  Competition as CompetitionType,
  Region,
  State,
  User,
} from "@/db/schema";

type Delegates = CompetitionDelegate & {
  delegate: User;
};

type Competition = CompetitionType & {
  state: State & {
    region: Region;
  };
  delegates: Delegates[];
};

export const columns: ColumnDef<Competition>[] = [
  {
    id: "startDate",
    accessorKey: "startDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Fecha Inicio <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-mono">
        {new Date(row.original.startDate).toISOString().split("T")[0]}
      </div>
    ),
  },
  {
    id: "endDate",
    accessorKey: "endDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Fecha Fin <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-mono">
        {new Date(row.original.endDate).toISOString().split("T")[0]}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nombre <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("name") || "Sin nombre"}</div>,
  },
  {
    id: "state",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Estado <ArrowUpDown />
      </Button>
    ),
    accessorFn: (row) => row.state?.name,
    cell: ({ row }) => <div>{row.getValue("state") || ""}</div>,
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Ciudad <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("city") || ""}</div>,
  },
  {
    accessorKey: "statusPublic",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Estado Público <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const v = row.getValue("statusPublic") as
        | CompetitionType["statusPublic"]
        | undefined;
      return (
        <span
          className={cn("text-xs px-2 py-1 rounded", getPublicStatusColor(v!))}
        >
          {formatPublicStatus(v!)}
        </span>
      );
    },
  },
  {
    accessorKey: "statusInternal",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Estado Interno <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const v = row.getValue("statusInternal") as
        | CompetitionType["statusInternal"]
        | undefined;
      return (
        <span
          className={cn(
            "text-xs px-2 py-1 rounded",
            getInternalStatusColor(v!),
          )}
        >
          {formatInternalStatus(v!)}
        </span>
      );
    },
  },
  {
    id: "delegates",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Delegados <ArrowUpDown />
      </Button>
    ),
    accessorKey: "delegates",
    cell: ({ row }) => {
      const delegates = row.getValue("delegates") as Delegates[] | undefined;
      if (!delegates || delegates.length === 0) {
        return (
          <span className="text-muted-foreground text-sm">Sin asignar</span>
        );
      }
      return (
        <AvatarGroup size={24}>
          {delegates
            .slice()
            .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
            .map((d) => (
              <Avatar
                key={d.delegateWcaId ?? d.delegate.name}
                title={`${d.delegate.name}${d.isPrimary ? " (Principal)" : ""}`}
              >
                <AvatarImage
                  src={d.delegate.image || undefined}
                  alt={d.delegate.name}
                />
                <AvatarFallback>
                  {d.delegate.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
        </AvatarGroup>
      );
    },
  },
  {
    accessorKey: "notes",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Notas <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) =>
      row.getValue("notes") ? (
        <span className="text-sm max-w-32 block truncate">
          {row.getValue("notes")}
        </span>
      ) : (
        <span className="text-muted-foreground text-sm">Sin notas</span>
      ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const comp = row.original;
      return (
        <Link
          href={`/panel/competencias/${comp.id}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <span className="sr-only">Editar</span>
          <Pencil size={16} />
        </Link>
      );
    },
  },
];

export function DataTable({ data }: { data: Competition[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrar por nombre..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay competencias disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
