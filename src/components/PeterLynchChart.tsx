import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

type LynchPoint = {
  date: string;   // ISO-String oder "YYYY-MM"
  price: number;  // Schlusskurs
  eps: number;    // Gewinn je Aktie (TTM empfohlen)
};

type Props = {
  data: LynchPoint[];
  defaultPE?: number; // Standard: 15
  defaultLogScale?: boolean; // Standard: true
  currency?: string; // "USD", "EUR" etc.
};

function fmt(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

function pct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(1)}%`;
}

export default function PeterLynchChart({
  data,
  defaultPE = 15,
  defaultLogScale = true,
  currency = "USD",
}: Props) {
  const [peMultiple, setPeMultiple] = useState<number>(defaultPE);
  const [useLog, setUseLog] = useState<boolean>(defaultLogScale);

  // 1) Clean & enrich data
  const prepared = useMemo(() => {
    // Filter ungültige Punkte für Log-Skala
    const filtered = data.filter(d =>
      Number.isFinite(d.price) && Number.isFinite(d.eps) &&
      d.price > 0 && d.eps > 0
    );
    return filtered.map(d => ({
      ...d,
      earningsLinePrice: d.eps * peMultiple, // EPS*PE = "Earnings-Line" in Preis-Einheiten
      premium: d.price / Math.max(d.eps * peMultiple, 1e-9) - 1, // + = über Earnings-Line
    }));
  }, [data, peMultiple]);

  // 2) Domains so wählen, dass 1 EPS ≙ peMultiple Preis
  const domains = useMemo(() => {
    if (prepared.length === 0) {
      return {
        leftMin: 0.1,
        leftMax: 10,
        rightMin: peMultiple * 0.1,
        rightMax: peMultiple * 10,
      };
    }
    let minEPS = Infinity, maxEPS = -Infinity;
    let minPrice = Infinity, maxPrice = -Infinity;
    let minEL = Infinity, maxEL = -Infinity;

    prepared.forEach(p => {
      minEPS = Math.min(minEPS, p.eps);
      maxEPS = Math.max(maxEPS, p.eps);
      minPrice = Math.min(minPrice, p.price);
      maxPrice = Math.max(maxPrice, p.price);
      minEL = Math.min(minEL, p.earningsLinePrice);
      maxEL = Math.max(maxEL, p.earningsLinePrice);
    });

    // linke Achse (EPS)
    const leftMin = Math.max(Math.min(minEPS, (minPrice / peMultiple), (minEL / peMultiple)), 1e-3);
    const leftMax = Math.max(maxEPS, (maxPrice / peMultiple), (maxEL / peMultiple));

    // rechte Achse (Preis)
    const rightMin = Math.max(Math.min(minPrice, minEL, leftMin * peMultiple), 1e-2);
    const rightMax = Math.max(maxPrice, maxEL, leftMax * peMultiple);

    return { leftMin, leftMax, rightMin, rightMax };
  }, [prepared, peMultiple]);

  const latest = prepared[prepared.length - 1];

  if (prepared.length === 0) {
    return (
      <div className="w-full p-8 text-center text-muted-foreground">
        <p>Keine gültigen Daten für Peter Lynch Chart verfügbar.</p>
        <p className="text-sm mt-2">Benötigt werden positive Kurs- und EPS-Werte.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">P/E-Multiple</span>
          <input
            type="number"
            min={1}
            step={1}
            value={peMultiple}
            onChange={(e) => setPeMultiple(Math.max(1, Number(e.target.value) || 1))}
            className="border rounded px-2 py-1 text-sm w-20 bg-background"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useLog}
            onChange={() => setUseLog(s => !s)}
            className="rounded"
          />
          <span className="text-sm">Logarithmische Skala</span>
        </label>

        {latest && (
          <div className="ml-auto text-sm">
            <span className={`inline-block rounded-full px-3 py-1 border text-xs font-medium ${
              latest.premium > 0.1 ? 'bg-red-50 text-red-700 border-red-200' :
              latest.premium < -0.1 ? 'bg-green-50 text-green-700 border-green-200' :
              'bg-yellow-50 text-yellow-700 border-yellow-200'
            }`}>
              Abweichung: <strong>{pct(latest.premium)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 420 }}>
        <ResponsiveContainer>
          <LineChart data={prepared} margin={{ left: 20, right: 20, top: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              minTickGap={28}
              stroke="hsl(var(--border))"
            />

            {/* Linke Achse: EPS */}
            <YAxis
              yAxisId="left"
              scale={useLog ? "log" : "auto"}
              domain={[domains.leftMin, domains.leftMax]}
              allowDataOverflow
              tickFormatter={(v) => v >= 1 ? `${v.toFixed(1)}` : v.toFixed(2)}
              width={60}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              label={{ value: 'EPS', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />

            {/* Rechte Achse: Preis */}
            <YAxis
              yAxisId="right"
              orientation="right"
              scale={useLog ? "log" : "auto"}
              domain={[domains.rightMin, domains.rightMax]}
              allowDataOverflow
              tickFormatter={(v) => fmt(v, currency)}
              width={80}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              label={{ value: 'Preis', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
            />

            <Tooltip
              formatter={(value: any, name: string) => {
                if (name === "Kurs") return [fmt(value as number, currency), name];
                if (name === `Earnings-Line (EPS×${peMultiple})`) return [fmt(value as number, currency), name];
                if (name === "EPS") return [(value as number).toFixed(2), name];
                if (name === "Abweichung") return [pct(value as number), name];
                return [value, name];
              }}
              labelFormatter={(label) => `Datum: ${label}`}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }}
            />
            <Legend />

            {/* Kurs (rechts) - Grüne Linie */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="price"
              name="Kurs"
              dot={false}
              strokeWidth={2}
              stroke="hsl(var(--chart-1))"
            />

            {/* Earnings-Line als Preislinie (rechts) - Blaue Linie */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="earningsLinePrice"
              name={`Earnings-Line (EPS×${peMultiple})`}
              dot={false}
              strokeWidth={2}
              stroke="hsl(var(--chart-2))"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded">
          <p className="font-medium mb-2">Peter Lynch Chart Interpretation:</p>
          <ul className="space-y-1 text-xs">
            <li><span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span><strong>Kurs unter Earnings-Line:</strong> Tendenziell unterbewertet (guter Kaufzeitpunkt)</li>
            <li><span className="inline-block w-3 h-3 bg-blue-500 rounded mr-2"></span><strong>Kurs über Earnings-Line:</strong> Überbewertet (Vorsicht bei Kauf)</li>
          </ul>
        </div>
        
        {latest && (
          <div className="text-sm p-3 rounded border">
            <p><strong>Aktuelle Bewertung:</strong></p>
            <p>Kurs: {fmt(latest.price, currency)} | Earnings-Line (P/E {peMultiple}): {fmt(latest.earningsLinePrice, currency)}</p>
            <p>Abweichung: {pct(latest.premium)} {latest.premium > 0.1 ? '(überbewertet)' : latest.premium < -0.1 ? '(unterbewertet)' : '(fair bewertet)'}</p>
          </div>
        )}
      </div>
    </div>
  );
}