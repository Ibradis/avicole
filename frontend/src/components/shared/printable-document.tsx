import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatGNF } from "@/lib/utils";

export type PrintableLine = {
  description: string;
  detail?: string;
  quantite?: number | string;
  unite?: string;
  prixUnitaire?: number | null;
  total?: number | null;
};

export type PrintableParty = {
  label: string;
  name: string;
  lines?: string[];
};

export type PrintableTotalRow = {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
};

export type PrintableMeta = {
  label: string;
  value: ReactNode;
};

export type PrintableDocumentProps = {
  /** "FACTURE", "BON DE COMMANDE", "REÇU", "BON DE LIVRAISON"… */
  docType: string;
  reference: string;
  date?: string;
  /** Optional secondary date (e.g. validation/réception/livraison) */
  secondaryDate?: { label: string; value: string };
  status?: string;
  /** Issuing organisation (top-left) */
  organisation: {
    name: string;
    tagline?: string;
    lines?: string[];
  };
  /** "To" party (client / fournisseur / destinataire) */
  party: PrintableParty;
  /** "From" party — defaults to organisation when omitted */
  issuer?: PrintableParty;
  meta?: PrintableMeta[];
  lines: PrintableLine[];
  totals: PrintableTotalRow[];
  notes?: string;
  /** Signature blocks at the bottom */
  signatures?: { label: string }[];
  /** Footer mentions légales / informations société */
  footer?: ReactNode;
  /** Extra classes on the root */
  className?: string;
};

/**
 * Print-only document. Wrap in <div className="hidden print:block"> when used
 * inline alongside on-screen content, or render directly when on a dedicated
 * print preview route.
 */
export function PrintableDocument({
  docType,
  reference,
  date,
  secondaryDate,
  status,
  organisation,
  party,
  issuer,
  meta,
  lines,
  totals,
  notes,
  signatures,
  footer,
  className,
}: PrintableDocumentProps) {
  const hasMonetary = lines.some((l) => l.prixUnitaire != null || l.total != null);

  return (
    <article
      className={cn(
        "print-document mx-auto w-full max-w-[820px] bg-white p-10 text-[11pt] leading-relaxed text-slate-900",
        className
      )}
    >
      <header className="flex items-start justify-between gap-8 border-b-2 border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-md bg-[#1B6B35] text-lg font-bold text-white"
              aria-hidden="true"
            >
              {organisation.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-slate-900">
                {organisation.name}
              </div>
              {organisation.tagline ? (
                <div className="text-xs text-slate-500">{organisation.tagline}</div>
              ) : null}
            </div>
          </div>
          {organisation.lines?.length ? (
            <div className="mt-3 space-y-0.5 text-xs text-slate-600">
              {organisation.lines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{docType}</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{reference}</div>
          {date ? (
            <div className="mt-1 text-xs text-slate-600">
              Émis le <span className="font-medium text-slate-900">{date}</span>
            </div>
          ) : null}
          {secondaryDate ? (
            <div className="text-xs text-slate-600">
              {secondaryDate.label} : <span className="font-medium text-slate-900">{secondaryDate.value}</span>
            </div>
          ) : null}
          {status ? (
            <div className="mt-2 inline-flex items-center rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
              {status}
            </div>
          ) : null}
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-6 avoid-break">
        <PartyBlock party={issuer ?? { label: "Émetteur", name: organisation.name, lines: organisation.lines }} />
        <PartyBlock party={party} />
      </section>

      {meta?.length ? (
        <section className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:grid-cols-4 avoid-break">
          {meta.map((m, i) => (
            <div key={i}>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{m.label}</div>
              <div className="mt-0.5 font-medium text-slate-900">{m.value}</div>
            </div>
          ))}
        </section>
      ) : null}

      {lines.length > 0 ? (
        <section className="mt-6">
          <table className="w-full border-collapse text-[10.5pt]">
            <thead>
              <tr className="border-b-2 border-slate-900 text-left text-[9pt] uppercase tracking-wider text-slate-700">
                <th className="w-10 py-2 pr-3 text-center">#</th>
                <th className="py-2 pr-3">Désignation</th>
                <th className="w-20 py-2 pr-3 text-right">Qté</th>
                {hasMonetary ? <th className="w-32 py-2 pr-3 text-right">Prix unitaire</th> : null}
                {hasMonetary ? <th className="w-32 py-2 text-right">Total</th> : null}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="border-b border-slate-200 align-top">
                  <td className="py-2 pr-3 text-center text-slate-500">{i + 1}</td>
                  <td className="py-2 pr-3">
                    <div className="font-medium text-slate-900">{line.description}</div>
                    {line.detail ? <div className="text-xs text-slate-500">{line.detail}</div> : null}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {line.quantite ?? "—"}
                    {line.unite ? <span className="ml-1 text-xs text-slate-500">{line.unite}</span> : null}
                  </td>
                  {hasMonetary ? (
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {line.prixUnitaire != null ? formatGNF(line.prixUnitaire) : "—"}
                    </td>
                  ) : null}
                  {hasMonetary ? (
                    <td className="py-2 text-right font-medium tabular-nums">
                      {line.total != null ? formatGNF(line.total) : "—"}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {totals.length ? (
        <section className="mt-4 flex justify-end avoid-break">
          <table className="w-full max-w-xs text-[10.5pt]">
            <tbody>
              {totals.map((t, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-slate-200 last:border-b-0",
                    t.strong && "border-t-2 border-slate-900",
                    t.muted && "text-slate-500"
                  )}
                >
                  <td className={cn("py-2 pr-4", t.strong && "font-bold uppercase tracking-wider")}>
                    {t.label}
                  </td>
                  <td
                    className={cn(
                      "py-2 text-right tabular-nums",
                      t.strong ? "text-base font-bold text-slate-900" : "font-medium"
                    )}
                  >
                    {t.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {notes ? (
        <section className="mt-6 rounded-md border-l-4 border-[#1B6B35] bg-slate-50 px-4 py-3 text-[10pt] text-slate-700 avoid-break">
          <div className="text-[9pt] font-semibold uppercase tracking-wider text-slate-500">Observations</div>
          <p className="mt-1 whitespace-pre-line">{notes}</p>
        </section>
      ) : null}

      {signatures?.length ? (
        <section className="mt-12 grid grid-cols-2 gap-12 avoid-break">
          {signatures.map((s, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto h-12 w-full border-b border-slate-400" />
              <div className="mt-1 text-xs text-slate-600">{s.label}</div>
            </div>
          ))}
        </section>
      ) : null}

      {footer ? (
        <footer className="mt-10 border-t border-slate-200 pt-3 text-center text-[9pt] text-slate-500">
          {footer}
        </footer>
      ) : null}
    </article>
  );
}

function PartyBlock({ party }: { party: PrintableParty }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{party.label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{party.name}</div>
      {party.lines?.length ? (
        <div className="mt-0.5 space-y-0.5 text-xs text-slate-600">
          {party.lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function buildOrganisation(user?: {
  entite_type?: string | null;
  entite_id?: number | null;
  email?: string;
}): PrintableDocumentProps["organisation"] {
  return {
    name: "Avicole ERP",
    tagline: "Gestion intégrée de l'exploitation avicole",
    lines: user?.email
      ? [
          user.email,
          user.entite_type
            ? `${user.entite_type === "ferme" ? "Ferme" : "Boutique"}${user.entite_id ? ` #${user.entite_id}` : ""}`
            : "",
        ].filter(Boolean)
      : undefined,
  };
}
