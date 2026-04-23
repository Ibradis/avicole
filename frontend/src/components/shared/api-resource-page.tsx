"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Edit, Eye, Loader2, PackageCheck, Plus, Printer, RotateCcw, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, SortHeader } from "@/components/shared/data-table";
import { ExportButtons } from "@/components/shared/export-buttons";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { apiClient } from "@/lib/axios";
import { API_ROUTES } from "@/lib/api-routes";
import { formatDateFr, formatGNF, unwrapResults } from "@/lib/utils";

type ResourceRow = Record<string, any> & { id?: number };
type FieldOption = { label: string; value: string };

export type ResourceField = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "textarea" | "select" | "checkbox" | "lines";
  linesFields?: ResourceField[];
  required?: boolean;
  hidden?: boolean | ((values: Record<string, any>) => boolean);
  options?: FieldOption[] | ((auth: any) => FieldOption[]);
  remoteResource?: string | ((values: Record<string, any>) => string);
  remoteLabel?: string;
  dependsOn?: string;
  placeholder?: string;
  defaultValue?: string | number | boolean;
};

export type ResourceColumn = {
  key: string;
  label: string;
  type?: "date" | "money" | "status" | "boolean" | "number";
};

export type ResourceConfig = {
  title: string;
  description: string;
  endpoint: string;
  exportBase: string;
  columns: ResourceColumn[];
  fields: ResourceField[];
  canCreate?: boolean | ((auth: any) => boolean);
  canEdit?: boolean | ((auth: any, row?: ResourceRow) => boolean);
  canDelete?: boolean | ((auth: any, row?: ResourceRow) => boolean);
  canPrint?: boolean | ((auth: any, row?: ResourceRow) => boolean);
  validateLabel?: string;
  validate?: (row: ResourceRow) => { url: string; method?: "post" | "patch"; payload?: ResourceRow };
  printTitle?: (row: ResourceRow) => string;
  detailView?: (row: ResourceRow, onBack: () => void) => React.ReactNode;
  customActions?: ResourceAction[];
};

export type ResourceAction = {
  id: string;
  label: string;
  icon?: any;
  variant?: "ghost" | "outline" | "default" | "destructive";
  show?: (row: ResourceRow, auth: any) => boolean;
  fields?: ResourceField[];
  submitLabel?: string;
  description?: string;
  action: (row: ResourceRow, values?: Record<string, any>) => { url: string; method?: "post" | "patch"; payload?: any };
  successMessage?: string;
};

function detailUrl(endpoint: string, id: number) {
  return `${endpoint.replace(/\/$/, "")}/${id}/`;
}

function normalizePayload(fields: ResourceField[], formData: FormData) {
  return fields.reduce<ResourceRow>((payload, field) => {
    if (field.type === "checkbox") {
      payload[field.name] = formData.get(field.name) === "on";
      return payload;
    }
    if (field.type === "lines") {
      try {
        payload[field.name] = JSON.parse(String(formData.get(field.name) || "[]"));
      } catch(e) {
        payload[field.name] = [];
      }
      return payload;
    }
    const value = String(formData.get(field.name) ?? "").trim();
    if (value === "" && !field.required) return payload;
    payload[field.name] = field.type === "number" ? Number(value) : value;
    return payload;
  }, {});
}

function displayCell(row: ResourceRow, column: ResourceColumn) {
  const value = row[column.key];
  if (column.type === "date") return formatDateFr(value);
  if (column.type === "money") return formatGNF(value);
  if (column.type === "boolean") return value ? "Oui" : "Non";
  if (column.type === "status") return <StatusBadge status={String(value ?? "-")} />;
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function PrintableRecord({ title, row, columns }: { title: string; row: ResourceRow; columns: ResourceColumn[] }) {
  return (
    <div className="hidden print:block">
      <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {columns.map((col) => (
            <tr key={col.key}>
              <th className="border px-3 py-2 text-left">{col.label}</th>
              <td className="border px-3 py-2">{displayCell(row, col)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RemoteSelect({
  field,
  values,
  defaultValue,
  required,
  value,
  onValueChange,
  name
}: {
  field: ResourceField;
  values: Record<string, any>;
  defaultValue?: string | number | boolean;
  required?: boolean;
  value?: string;
  onValueChange?: (val: string) => void;
  name?: string;
}) {
  const resource = typeof field.remoteResource === "function" 
    ? field.remoteResource(values) 
    : field.remoteResource;

  const { data = [], isLoading } = useQuery({
    queryKey: ["options", resource],
    queryFn: async () => {
      if (!resource) return [];
      const response = await apiClient.get<any[] | { results?: any[] }>(resource);
      const results = unwrapResults(response.data);
      return results.map((item: any) => ({
        label: String(item[field.remoteLabel || "nom"] || item.nom || item.label || item.id),
        value: String(item.id)
      }));
    },
    enabled: !!resource
  });

  return (
    <Select 
      name={field.name} 
      defaultValue={defaultValue ? String(defaultValue) : undefined} 
      value={value}
      onValueChange={onValueChange}
      required={required}
    >
      <SelectTrigger id={field.name}>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <SelectValue placeholder={isLoading ? "Chargement..." : (field.placeholder ?? `Choisir ${field.label.toLowerCase()}`)} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {data.map((opt: FieldOption) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LinesField({
  field,
  values,
  onChange,
  auth
}: {
  field: ResourceField;
  values: Record<string, any>;
  onChange: (val: any[]) => void;
  auth: any;
}) {
  const lines = (values[field.name] as any[]) || [];
  
  const handleAdd = () => onChange([...lines, {}]);
  const handleRemove = (index: number) => onChange(lines.filter((_, i) => i !== index));
  const handleChangeLine = (index: number, subName: string, subValue: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [subName]: subValue };
    onChange(newLines);
  };

  const lineConfig = field.linesFields || [];

  return (
    <div className="space-y-4 rounded-md border p-4 bg-muted/20 md:col-span-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{field.label}</h4>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter {field.label}
        </Button>
      </div>
      
      {lines.map((line, index) => (
        <div key={index} className="flex flex-wrap items-end gap-3 p-3 border rounded-md bg-background relative mt-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => handleRemove(index)}
          >
            <X className="h-3 w-3" />
          </Button>
          
          {lineConfig.map(subField => {
            const val = line[subField.name] ?? "";
            return (
              <div key={subField.name} className="flex-1 min-w-[150px] space-y-1">
                <Label className="text-xs">
                  {subField.label}
                  {subField.required && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
                {subField.remoteResource ? (
                  <RemoteSelect 
                    field={subField} 
                    values={line} 
                    value={val ? String(val) : undefined}
                    onValueChange={(newVal) => handleChangeLine(index, subField.name, newVal)}
                  />
                ) : subField.type === "number" ? (
                  <Input 
                    type="number" 
                    value={val} 
                    onChange={(e) => handleChangeLine(index, subField.name, Number(e.target.value))} 
                    className="h-8 text-sm"
                  />
                ) : (
                  <Input 
                    type="text" 
                    value={val} 
                    onChange={(e) => handleChangeLine(index, subField.name, e.target.value)} 
                    className="h-8 text-sm"
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
      <input type="hidden" name={field.name} value={JSON.stringify(lines)} />
    </div>
  );
}

export function ResourceForm({
  fields,
  initialData,
  isSaving,
  onSubmit
}: {
  fields: ResourceField[];
  initialData?: ResourceRow | null;
  isSaving: boolean;
  onSubmit: (payload: ResourceRow) => void;
}) {
  const auth = useAuthStore();
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    fields.forEach((f) => {
      let val = initialData?.[f.name] ?? f.defaultValue;
      if (val === undefined || val === null || val === "") {
        if (f.name === "entite_type") val = auth.entite_type || "ferme";
        if (f.name === "entite_id") val = auth.entite_id;
      }
      defaults[f.name] = val;
    });
    return defaults;
  });

  const handleFieldChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    onSubmit(normalizePayload(fields, new FormData(form)));
  };

  return (
    <form id="resource-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      {fields.map((field) => {
        const value = formValues[field.name] ?? "";
        
        // Simplification : Masquer entite_type/id si l'utilisateur est lié à une entité fixe
        const isFixedEntity = !!auth.entite_id && auth.role !== "admin" && auth.role !== "pdg";
        const isEntityField = field.name === "entite_type" || field.name === "entite_id";
        
        const isHidden = (typeof field.hidden === "function" ? field.hidden(formValues) : field.hidden) || (isEntityField && isFixedEntity);
        
        if (isHidden) {
          return <input key={field.name} type="hidden" name={field.name} value={String(value || "")} />;
        }
        const isWide = field.type === "textarea" || field.type === "checkbox" || field.type === "lines";

        if (field.type === "lines") {
          return (
            <LinesField 
              key={field.name} 
              field={field} 
              values={formValues} 
              onChange={(val) => handleFieldChange(field.name, val)} 
              auth={auth} 
            />
          );
        }

        return (
          <div key={field.name} className={isWide ? "space-y-2 md:col-span-2" : "space-y-2"}>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="ml-0.5 text-destructive">*</span>}
            </Label>
            {field.remoteResource ? (
              <RemoteSelect field={field} values={formValues} defaultValue={value} required={field.required} />
            ) : field.type === "select" ? (
              <Select
                name={field.name}
                value={String(value || "")}
                onValueChange={(val) => handleFieldChange(field.name, val)}
                required={field.required}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={field.placeholder ?? `Choisir ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {(typeof field.options === "function" ? field.options(auth) : field.options)?.map((opt: FieldOption) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                value={String(value ?? "")}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : field.type === "checkbox" ? (
              <div className="flex items-center gap-2">
                <Input
                  id={field.name}
                  name={field.name}
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">{field.label}</span>
              </div>
            ) : (
              <Input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                value={String(value ?? "")}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                step={field.type === "number" ? "0.01" : undefined}
              />
            )}
          </div>
        );
      })}
    </form>
  );
}

function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. L&apos;enregistrement sera définitivement supprimé.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResourceDetail({ 
  config, 
  row, 
  onBack 
}: { 
  config: ResourceConfig; 
  row: ResourceRow; 
  onBack: () => void 
}) {
  const fields = config.fields.filter(f => f.type !== "lines");
  const lineFields = config.fields.filter(f => f.type === "lines");

  return (
    <div className="space-y-6 px-4 pb-8 lg:px-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => {
          if (field.hidden === true) return null;
          return (
            <div key={field.name} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</p>
              <p className="text-sm font-semibold">{displayCell(row, { key: field.name, label: field.label, type: field.type as any })}</p>
            </div>
          );
        })}
      </div>

      {lineFields.map((field) => {
        const lines = row[field.name] || row["lignes"] || [];
        if (!Array.isArray(lines) || lines.length === 0) return null;

        return (
          <div key={field.name} className="space-y-3">
            <h3 className="text-lg font-bold border-b pb-2">{field.label}</h3>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {field.linesFields?.map(lf => (
                      <th key={lf.name} className="px-4 py-2 text-left font-medium">{lf.label}</th>
                    ))}
                    <th className="px-4 py-2 text-right font-medium">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lines.map((line: any, idx: number) => (
                    <tr key={idx}>
                      {field.linesFields?.map(lf => (
                        <td key={lf.name} className="px-4 py-2">
                          {lf.name.endsWith("_nom") || lf.name === "produit_nom" ? line[lf.name] : line[lf.name] || line[lf.name.replace("_id", "_nom")] || "-"}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right font-mono">{formatGNF(line.sous_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfooter className="bg-muted/30 font-bold">
                  <tr>
                    <td colSpan={(field.linesFields?.length || 0)} className="px-4 py-2 text-right">TOTAL</td>
                    <td className="px-4 py-2 text-right font-mono text-primary">{formatGNF(row.montant_total)}</td>
                  </tr>
                </tfooter>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ApiResourcePage({ config }: { config: ResourceConfig }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ResourceRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResourceRow | null>(null);
  const [printRow, setPrintRow] = useState<ResourceRow | null>(null);
  const [viewingDetail, setViewingDetail] = useState<ResourceRow | null>(null);
  const [activeAction, setActiveAction] = useState<{ action: ResourceAction; row: ResourceRow } | null>(null);
  const auth = useAuthStore();
  
  const resolvePermission = (val: any, defaultVal: boolean, row?: ResourceRow) => typeof val === "function" ? val(auth, row) : (val ?? defaultVal);
  const canCreate = resolvePermission(config.canCreate, config.fields.length > 0);
  const canPrint = resolvePermission(config.canPrint, true);

  const queryKey = ["resource", config.endpoint];
  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<ResourceRow[] | { results?: ResourceRow[] }>(config.endpoint);
      return unwrapResults(response.data);
    }
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const saveMutation = useMutation({
    mutationFn: async (payload: ResourceRow) => {
      if (editing?.id) return apiClient.patch(detailUrl(config.endpoint, editing.id), payload);
      return apiClient.post(config.endpoint, payload);
    },
    onSuccess: () => {
      toast.success(editing?.id ? "Modifications enregistrées" : "Élément créé avec succès");
      setIsFormOpen(false);
      setEditing(null);
      refresh();
    },
    onError: () => toast.error("Enregistrement refusé par l'API")
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: ResourceRow) => apiClient.delete(detailUrl(config.endpoint, row.id as number)),
    onSuccess: () => {
      toast.success("Suppression effectuée");
      setDeleteTarget(null);
      refresh();
    },
    onError: () => toast.error("Suppression indisponible pour cette ressource")
  });

  const validateMutation = useMutation({
    mutationFn: async (row: ResourceRow) => {
      if (!config.validate) return;
      const action = config.validate(row);
      if (action.method === "patch") return apiClient.patch(action.url, action.payload ?? {});
      return apiClient.post(action.url, action.payload ?? {});
    },
    onSuccess: () => {
      toast.success("Validation effectuée");
      refresh();
    },
    onError: () => toast.error("Validation indisponible pour cette ressource")
  });

  const customActionMutation = useMutation({
    mutationFn: async ({ action, row, values }: { action: ResourceAction; row: ResourceRow; values?: Record<string, any> }) => {
      const act = action.action(row, values);
      if (act.method === "patch") return apiClient.patch(act.url, act.payload ?? {});
      return apiClient.post(act.url, act.payload ?? {});
    },
    onSuccess: (_, variables) => {
      toast.success(variables.action.successMessage || "Action effectuée avec succès");
      setActiveAction(null);
      refresh();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.error || "Une erreur est survenue lors de l'action";
      toast.error(msg);
    }
  });

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: ResourceRow) => {
    setEditing(row);
    setIsFormOpen(true);
  };

  const columns = useMemo<ColumnDef<ResourceRow>[]>(() => {
    const resourceColumns: ColumnDef<ResourceRow>[] = config.columns.map((col) => ({
      accessorKey: col.key,
      header: ({ column }) => (
        <button className="text-left" onClick={() => column.toggleSorting()}>
          <SortHeader label={col.label} />
        </button>
      ),
      cell: ({ row }) => displayCell(row.original, col)
    }));

    resourceColumns.push({
      id: "actions",
      header: "Actions",
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {config.detailView && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Détails"
              title="Détails"
              onClick={() => setViewingDetail(row.original)}
            >
              <Eye className="h-4 w-4 text-blue-600" />
            </Button>
          )}
          {resolvePermission(config.canEdit, config.fields.length > 0, row.original) && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Modifier"
              onClick={() => openEdit(row.original)}
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {config.validateLabel && (
            <Button
              size="icon"
              variant="ghost"
              aria-label={config.validateLabel}
              title={config.validateLabel}
              onClick={() => validateMutation.mutate(row.original)}
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )}
            </Button>
          )}
          {canPrint && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Imprimer"
              title="Imprimer"
              onClick={() => {
                setPrintRow(row.original);
                setTimeout(() => window.print(), 50);
              }}
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}
          {resolvePermission(config.canDelete, true, row.original) && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Supprimer"
              title="Supprimer"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
          {config.customActions?.map((action) => {
            const shouldShow = action.show ? action.show(row.original, auth) : true;
            if (!shouldShow) return null;
            const Icon = action.icon || CheckCircle2;
            return (
              <Button
                key={action.id}
                size="icon"
                variant={action.variant || "ghost"}
                aria-label={action.label}
                title={action.label}
                onClick={() => {
                  if (action.fields && action.fields.length > 0) {
                    setActiveAction({ action, row: row.original });
                  } else {
                    customActionMutation.mutate({ action, row: row.original });
                  }
                }}
                disabled={customActionMutation.isPending}
              >
                {customActionMutation.isPending && activeAction?.action.id === action.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </Button>
            );
          })}
        </div>
      )
    });

    return resourceColumns as any[];
  }, [auth, config, customActionMutation.isPending, validateMutation]);

  return (
    <>
      {viewingDetail && config.detailView ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 pt-4 lg:px-8">
            <Button variant="ghost" onClick={() => setViewingDetail(null)} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Retour à la liste
            </Button>
          </div>
          {config.detailView 
            ? config.detailView(viewingDetail, () => setViewingDetail(null))
            : <ResourceDetail config={config} row={viewingDetail} onBack={() => setViewingDetail(null)} />
          }
        </div>
      ) : (
        <>
          <PageHeader
            title={config.title}
            description={config.description}
            actions={
              <>
                <ExportButtons
                  baseName={config.exportBase}
                  pdfUrl={API_ROUTES.exports.reportingPdf(config.exportBase)}
                  excelUrl={API_ROUTES.exports.reportingExcel(config.exportBase)}
                />
                <Button variant="outline" onClick={refresh}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Actualiser
                </Button>
                {canCreate && (
                  <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau
                  </Button>
                )}
              </>
            }
          />

          <div className="p-4 lg:p-8">
            <DataTable
              columns={columns as any}
              data={data}
              isLoading={isLoading}
              searchPlaceholder={`Rechercher dans ${config.title.toLowerCase()}...`}
            />
          </div>
        </>
      )}

      {/* Modal formulaire */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? `Modifier — ${config.title}` : `Nouveau — ${config.title}`}</DialogTitle>
            <DialogDescription>
              {editing?.id ? "Modifiez les informations ci-dessous puis enregistrez." : "Remplissez le formulaire pour créer un nouvel élément."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <ResourceForm
              fields={config.fields}
              initialData={editing}
              isSaving={saveMutation.isPending}
              onSubmit={(payload) => saveMutation.mutate(payload)}
            />
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFormOpen(false);
                setEditing(null);
              }}
              disabled={saveMutation.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" form="resource-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmation suppression */}
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        isDeleting={deleteMutation.isPending}
      />

      {/* Modal Action Personnalisée */}
      <Dialog open={activeAction !== null} onOpenChange={(open) => !open && setActiveAction(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{activeAction?.action.label}</DialogTitle>
            <DialogDescription>
              {activeAction?.action.description || "Veuillez renseigner les informations ci-dessous."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {activeAction && (
              <ResourceForm 
                fields={activeAction.action.fields || []}
                isSaving={customActionMutation.isPending}
                onSubmit={(values) => customActionMutation.mutate({ action: activeAction.action, row: activeAction.row, values })}
              />
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveAction(null)} disabled={customActionMutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" form="resource-form" disabled={customActionMutation.isPending}>
              {customActionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (activeAction?.action.submitLabel || "Valider")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zone imprimable */}
      {printRow ? (
        <PrintableRecord
          title={config.printTitle?.(printRow) ?? config.title}
          row={printRow}
          columns={config.columns}
        />
      ) : null}
    </>
  );
}
