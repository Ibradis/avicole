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
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

export function SortHeader({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  );
}

type SelectOption = { value: string; label: string };

export type TableFilter =
  | { type: "select"; key: string; label: string; options: SelectOption[] }
  | { type: "dateRange"; key: string; label: string };

type FilterValues = Record<string, { from?: string; to?: string } | string>;

function valueAsString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function matchesFilters<TData>(row: TData, filters: TableFilter[], values: FilterValues): boolean {
  for (const filter of filters) {
    const raw = (row as Record<string, unknown>)[filter.key];
    if (filter.type === "select") {
      const selected = values[filter.key];
      if (typeof selected === "string" && selected && selected !== "__all__" && valueAsString(raw) !== selected) {
        return false;
      }
    } else if (filter.type === "dateRange") {
      const range = values[filter.key];
      if (range && typeof range === "object") {
        const rowDate = valueAsString(raw).slice(0, 10);
        if (!rowDate) return !range.from && !range.to;
        if (range.from && rowDate < range.from) return false;
        if (range.to && rowDate > range.to) return false;
      }
    }
  }
  return true;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  searchPlaceholder = "Filtrer...",
  filters,
  pageSize: initialPageSize = 10,
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  filters?: TableFilter[];
  pageSize?: number;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = useMemo(() => {
    if (!filters?.length) return 0;
    return filters.reduce((acc, filter) => {
      const value = filterValues[filter.key];
      if (filter.type === "select") {
        return typeof value === "string" && value && value !== "__all__" ? acc + 1 : acc;
      }
      if (filter.type === "dateRange") {
        return value && typeof value === "object" && (value.from || value.to) ? acc + 1 : acc;
      }
      return acc;
    }, 0);
  }, [filters, filterValues]);

  const filteredData = useMemo(() => {
    if (!filters?.length || activeFilterCount === 0) return data;
    return data.filter((row) => matchesFilters(row, filters, filterValues));
  }, [data, filters, filterValues, activeFilterCount]);

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
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    initialState: { pagination: { pageSize: initialPageSize } },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const clearAllFilters = () => {
    setGlobalFilter("");
    setFilterValues({});
  };

  const updateFilterValue = (key: string, value: FilterValues[string]) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const resultCount = table.getFilteredRowModel().rows.length;
  const hasAnyFilter = Boolean(globalFilter) || activeFilterCount > 0;
  const pageSize = table.getState().pagination.pageSize;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-1 items-center gap-2">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              className="pl-9 pr-10"
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              aria-label="Recherche"
            />
            {globalFilter ? (
              <Button
                className="absolute right-1 top-1 h-8 w-8"
                variant="ghost"
                size="icon"
                onClick={() => setGlobalFilter("")}
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          {filters?.length ? (
            <Button
              type="button"
              variant={activeFilterCount > 0 ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              aria-controls="advanced-filters-panel"
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filtres
              {activeFilterCount > 0 ? (
                <Badge className="ml-1 h-5 min-w-[1.25rem] px-1 text-xs">{activeFilterCount}</Badge>
              ) : null}
            </Button>
          ) : null}
          {hasAnyFilter ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearAllFilters}>
              Tout effacer
            </Button>
          ) : null}
        </div>
        <div className="text-sm text-muted-foreground">
          {resultCount} résultat{resultCount > 1 ? "s" : ""}
        </div>
      </div>

      {filters?.length && showFilters ? (
        <div
          id="advanced-filters-panel"
          className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filters.map((filter) => {
            if (filter.type === "select") {
              const value = (filterValues[filter.key] as string) || "__all__";
              return (
                <div key={filter.key} className="space-y-1.5">
                  <Label>{filter.label}</Label>
                  <Select
                    value={value}
                    onValueChange={(v) => updateFilterValue(filter.key, v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Tous</SelectItem>
                      {filter.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }
            const range = (filterValues[filter.key] as { from?: string; to?: string }) || {};
            return (
              <div key={filter.key} className="space-y-1.5">
                <Label>{filter.label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={range.from ?? ""}
                    onChange={(e) => updateFilterValue(filter.key, { ...range, from: e.target.value })}
                    aria-label={`${filter.label} : du`}
                  />
                  <span className="text-xs text-muted-foreground">→</span>
                  <Input
                    type="date"
                    value={range.to ?? ""}
                    onChange={(e) => updateFilterValue(filter.key, { ...range, to: e.target.value })}
                    aria-label={`${filter.label} : au`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

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
              ? Array.from({ length: pageSize }).map((_, index) => (
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
                  <TableCell colSpan={columns.length} className="p-0">
                    <EmptyState
                      title={hasAnyFilter ? "Aucun résultat" : "Aucune donnée disponible"}
                      description={
                        hasAnyFilter
                          ? "Essayez d'ajuster votre recherche ou de retirer les filtres."
                          : "Les éléments apparaîtront ici dès qu'ils seront créés."
                      }
                      actionLabel={hasAnyFilter ? "Effacer les filtres" : undefined}
                      onAction={hasAnyFilter ? clearAllFilters : undefined}
                    />
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Lignes par page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
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
