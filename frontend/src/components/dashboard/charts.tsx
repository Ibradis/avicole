"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGNF } from "@/lib/utils";
import type { ChartPoint, StockItem } from "@/types/api";

const COLORS = ["#1B6B35", "#D97706", "#2563EB", "#DC2626"];

function EmptyChart() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Aucune donnée API disponible</div>;
}

function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-card p-3 text-xs shadow-sm">
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((item: any) => (
        <div key={item.dataKey} className="flex gap-2">
          <span>{item.name}</span>
          <span className="font-medium">{formatGNF(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: { data: ChartPoint[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Recettes vs charges</CardTitle></CardHeader>
      <CardContent className="h-72">
        {!data.length ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend />
            <Bar dataKey="recettes" name="Recettes" fill="#1B6B35" radius={[4, 4, 0, 0]} />
            <Bar dataKey="charges" name="Charges" fill="#D97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductionChart({ data }: { data: ChartPoint[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Production oeufs</CardTitle></CardHeader>
      <CardContent className="h-72">
        {!data.length ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="production" name="Oeufs" stroke="#2563EB" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function TresorerieChart({ data }: { data: ChartPoint[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Trésorerie cumulée</CardTitle></CardHeader>
      <CardContent className="h-72">
        {!data.length ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="tresorerie" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B6B35" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#1B6B35" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M`} />
            <Tooltip content={<CurrencyTooltip />} />
            <ReferenceLine y={0} stroke="#DC2626" />
            <Area type="monotone" dataKey="tresorerie" stroke="#1B6B35" strokeWidth={2} fill="url(#tresorerie)" />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function VentesDonut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Répartition CA</CardTitle></CardHeader>
      <CardContent className="h-72">
        {!data.length ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} label={({ percent }) => (percent > 0.05 ? `${Math.round(percent * 100)}%` : "")}>
              {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function StockAlertChart({ data }: { data: StockItem[] }) {
  const rows = data.slice(0, 6).map((item) => ({ name: item.produit_libelle ?? `Produit ${item.produit ?? item.id}`, stock: Number(item.quantite_actuelle ?? 0), seuil: Number(item.seuil_alerte ?? 0) }));
  return (
    <Card>
      <CardHeader><CardTitle>Stocks sous seuil</CardTitle></CardHeader>
      <CardContent className="h-72">
        {!rows.length ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <ReferenceLine x={rows[0]?.seuil ?? 0} stroke="#D97706" />
            <Bar dataKey="stock" name="Stock" radius={[0, 4, 4, 0]}>
              {rows.map((row, index) => <Cell key={index} fill={row.stock === 0 ? "#DC2626" : "#D97706"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function COFOChart({ data }: { data: ChartPoint[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>COFO financier</CardTitle></CardHeader>
      <CardContent className="h-72">
        {!data.length ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend />
            <Bar dataKey="investissement" name="Investissement" fill="#D97706" radius={[4, 4, 0, 0]} />
            <Bar dataKey="encaissement" name="Encaissement" fill="#1B6B35" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
