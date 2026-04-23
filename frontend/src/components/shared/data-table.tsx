"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState
} from "@tanstack/react-table";
import { ArrowUpDown, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SortHeader({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </span>
  );
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  searchPlaceholder = "Filtrer..."
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  searchPlaceholder?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const globalSearch: FilterFn<TData> = (row, _columnId, filterValue) => {
    const terms = String(filterValue ?? "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!terms.length) return true;

    const searchable = Object.values(row.original as Record<string, unknown>)
      .filter((value) => value !== null && value !== undefined && typeof value !== "object")
      .join(" ")
      .toLowerCase();

    return terms.every((term) => searchable.includes(term));
  };

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 pr-10" placeholder={searchPlaceholder} value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} />
          {globalFilter ? (
            <Button className="absolute right-1 top-1 h-8 w-8" variant="ghost" size="icon" onClick={() => setGlobalFilter("")} aria-label="Effacer la recherche">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} résultat{table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
        </div>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.length
                ? table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                      Aucune donnée disponible
                    </TableCell>
                  </TableRow>
                )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Lignes par page</span>
          <Select value={String(table.getState().pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
        </div>
        <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Précédent
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Suivant
        </Button>
        </div>
      </div>
    </div>
  );
}
