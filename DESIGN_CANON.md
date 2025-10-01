# Aesy Design Canon v1.0
**Erstellt:** 2025-10-01  
**Status:** Verbindlich – IMMER anwenden (außer bei explizitem "Override")

---

## A. Executive Summary

### Ziel der Vorlage
Diese Design-Vorlage definiert das verbindliche Erscheinungsbild und die Interaktionsmuster für **Aesy**, eine Web-Applikation zur Aktienanalyse nach bewährten Investment-Prinzipien. Sie richtet sich an **Anfänger-Investoren** und unterstützt drei Kern-Use-Cases: **Daily Screening**, **Deep Research** und **Portfolio-Tracking**. 

Das Design folgt Apple's 2025 Design-Sprache mit Glass-Morphism, klarer Hierarchie und optimaler Lesbarkeit. Alle Komponenten sind **WCAG 2.2 AA-konform**, **BaFin-compliant** (transparente Risikohinweise, keine irreführenden Versprechen) und **i18n-ready** (primär Deutsch, erweiterbar).

### Primäre Designprinzipien
1. **Clarity First** – Finanzinformationen sind komplex; unser Interface ist es nicht. Klare Typografie, großzügiger Weißraum, eindeutige Hierarchie.
2. **Trust through Transparency** – Datenquellen, Berechnungsmethoden und Limitationen werden offen kommuniziert (BaFin-Konformität).
3. **Progressive Disclosure** – Anfänger sehen Kern-Insights sofort; Details auf Anfrage (Tooltips, Expander, Modals).
4. **Consistent & Predictable** – Gleiche Patterns an gleichen Stellen; keine Überraschungen.
5. **Accessible by Default** – Tastaturnavigation, Kontraste, Screenreader-Support sind nicht optional.

---

## B. Marken- & Stil-Richtlinien

### Markenwerte & Tonalität

**Brand Personality:**
- Professionell, aber nicht steif
- Kompetent, aber nicht herablassend  
- Transparent, nicht verkäuferisch

**Voice & Tone:**
- **Du-Form** durchgehend (persönlich, einladend)
- **Professionell-freundlich:** "Hier ist deine Analyse" statt "Na, willst du mal schauen?"
- **Erklärender Stil:** Fachbegriffe werden kontextuell erläutert (Tooltips, Inline-Hilfen)

**Microcopy Do's:**
- ✅ "Analyse wird geladen..." (Prozess transparent)
- ✅ "Keine Daten verfügbar – Ticker überprüfen" (nächster Schritt klar)
- ✅ "Buffett-Score: 8/10 – Sehr gute Qualität" (Wertung + Einordnung)
- ✅ "Risikohinweis: Vergangene Performance garantiert keine zukünftigen Erträge" (BaFin)

**Microcopy Don'ts:**
- ❌ "Kaufen!" / "Jetzt zuschlagen!" (manipulativ, BaFin-kritisch)
- ❌ "Garantiert 20% Rendite" (irreführend)
- ❌ "Fehler" ohne Kontext (frustrierend)
- ❌ Fachjargon ohne Erklärung ("ROIC" → "ROIC (Return on Invested Capital)")

**Numerik & Formatierung:**
- Zahlen: `1.234,56 €` (deutsches Format, Tausenderpunkt, Komma-Dezimal)
- Prozent: `12,5 %` (Leerzeichen vor %)
- Datum: `01.10.2025` (TT.MM.JJJJ)
- Große Zahlen: `1,2 Mrd. €` (nicht `1.234.567.890`)

---

### Typografie

**Font-Stack:**
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, Inter, sans-serif;
```

**Rollen & Rem-Skala:**

| Rolle              | Größe  | Line-Height | Weight | Use-Case                          |
|--------------------|--------|-------------|--------|-----------------------------------|
| **Display (H1)**   | 2rem   | 1.2         | 600    | Page Titles                       |
| **Headline (H2)**  | 1.5rem | 1.3         | 600    | Section Headers                   |
| **Title (H3)**     | 1.25rem| 1.4         | 600    | Card Headers, Subsections         |
| **Body Large**     | 1.125rem| 1.5        | 400    | Intro Text, Key Metrics           |
| **Body (Base)**    | 1rem   | 1.5         | 400    | Standard Text, Paragraphs         |
| **Body Small**     | 0.875rem| 1.5        | 400    | Helper Text, Captions             |
| **Label**          | 0.875rem| 1.4        | 500    | Form Labels, Buttons              |
| **Caption**        | 0.75rem| 1.4         | 400    | Metadata, Timestamps              |

**Minimale Schriftgrößen:**
- Desktop: 16px (1rem) für Body
- Mobile: 16px (iOS Auto-Zoom vermeiden)
- Caption: 12px (0.75rem) – absolute Untergrenze

**Weitere Regeln:**
- **Laufweite (letter-spacing):** 
  - Headlines: `-0.02em` (tighter)
  - Labels/Buttons: `0.01em` (slight expand für Lesbarkeit)
- **Schriftglättung:** `-webkit-font-smoothing: antialiased;`
- **Feature Settings:** `"rlig" 1, "calt" 1` (Ligaturen für SF Pro)

---

### Farb-System

**HSL-Basis (semantische Tokens):**

#### Light Mode
```css
--background: 0 0% 100%;          /* #FFFFFF */
--foreground: 220 16% 13%;        /* #1E2329 */
--primary: 213 100% 52%;          /* #0A84FF (Apple Blue) */
--primary-foreground: 0 0% 100%;  /* #FFFFFF */
--muted: 220 14% 96%;             /* #F5F5F7 */
--muted-foreground: 220 9% 46%;   /* #6E7175 */
--border: 220 13% 91%;            /* #E5E5EA */
--destructive: 0 84% 60%;         /* #FF3B30 (Apple Red) */
--card: 0 0% 100%;                /* #FFFFFF */
```

#### Dark Mode
```css
--background: 220 16% 13%;        /* #1E2329 */
--foreground: 0 0% 100%;          /* #FFFFFF */
--primary: 213 100% 52%;          /* #0A84FF */
--muted: 220 14% 20%;             /* #2C2D30 */
--muted-foreground: 220 9% 60%;   /* #9199A1 */
--border: 220 13% 25%;            /* #3A3B3E */
--destructive: 0 84% 60%;         /* #FF3B30 */
--card: 220 14% 16%;              /* #25262A */
```

**Status-Farben (Buffett-Score):**
```css
--buffett-red: #FF3B30;     /* Score 0-4: Schwach */
--buffett-yellow: #FFCC00;  /* Score 5-6: Mittel */
--buffett-green: #34C759;   /* Score 7-10: Stark */
--buffett-blue: #007AFF;    /* Neutral/Info */
```

**Kontrast-Regeln (WCAG 2.2 AA):**
- Text auf Background: ≥ 4.5:1
- Large Text (≥18pt): ≥ 3:1
- UI-Controls: ≥ 3:1
- Fokus-Indikatoren: ≥ 3:1, mindestens 2px dick

**Glass-Morphism:**
```css
/* Light Mode */
--glass-background: rgba(255, 255, 255, 0.1);
--glass-border: rgba(0, 0, 0, 0.1);

/* Dark Mode */
--glass-background: rgba(0, 0, 0, 0.25);
--glass-border: rgba(0, 0, 0, 0.15);

/* Usage */
.glass-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--border);
}
```

---

### Spacing & Grid

**Spacing-System (8pt-Raster, erweitert 4pt für Details):**

| Token  | Rem     | Px  | Use-Case                          |
|--------|---------|-----|-----------------------------------|
| `0.5`  | 0.125   | 2px | Hairline Borders                  |
| `1`    | 0.25    | 4px | Icon-Text Gaps                    |
| `2`    | 0.5     | 8px | Button Padding (internal)         |
| `3`    | 0.75    | 12px| Tight Element Spacing             |
| `4`    | 1       | 16px| Default Gap (Components)          |
| `6`    | 1.5     | 24px| Section Spacing                   |
| `8`    | 2       | 32px| Major Section Margins             |
| `12`   | 3       | 48px| Page-Level Padding                |
| `18`   | 4.5     | 72px| Header Height                     |

**Container-Breiten:**
```css
max-w-screen-sm:   640px  /* Narrow Content (Auth) */
max-w-screen-md:   768px  /* Standard Forms */
max-w-screen-lg:   1024px /* Analyzer Results */
max-w-screen-xl:   1280px /* Dashboards */
max-w-[1440px]:    1440px /* Max Content Width */
```

**Breakpoints:**
```javascript
screens: {
  'xs': '480px',   // Small phones
  'sm': '640px',   // Large phones
  'md': '768px',   // Tablets
  'lg': '1024px',  // Laptops
  'xl': '1280px',  // Desktops
  '2xl': '1536px', // Large Desktops
}
```

**Layout-Regeln:**
- **Mobile First:** Alle Layouts ab 320px (iPhone SE)
- **Container Padding:** `px-4` (mobile), `px-6` (md), `px-8` (lg)
- **Sidebar:** `280px` fix (Desktop), `100%` full-screen overlay (Mobile)
- **Header:** `72px` (4.5rem) fix, sticky/fixed

---

### Iconography

**Lucide React:**
- Primäre Icon-Library: `lucide-react`
- **Größen:**
  - Small: `h-4 w-4` (16px) – Inline, Badges
  - Default: `h-5 w-5` (20px) – Buttons, Nav
  - Large: `h-6 w-6` (24px) – Headers, Feature Cards
  - XL: `h-8 w-8` (32px) – Empty States
- **Stroke-Width:** `2` (Default), `1.5` (Subtle)
- **Farbe:** `currentColor` (erbt Text-Farbe)

**Verwendung:**
```tsx
import { TrendingUp } from 'lucide-react';

<TrendingUp className="h-5 w-5 text-buffett-green" />
```

**Illustration:**
- Stil: Minimalistisch, flat, 2-3 Farben
- Empty States: Lucide Icons + Text (kein Custom Art)

---

### Motion

**Dauer (schnell & responsive):**
- **Instant:** `100ms` – Hover, Focus
- **Quick:** `200ms` – Toggles, Accordions
- **Standard:** `300ms` – Modals, Sheets
- **Slow:** `500ms` – Page Transitions

**Easing:**
```css
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);    /* Default */
--ease-in-out: cubic-bezier(0.4, 0, 0.6, 1); /* Smooth */
```

**Reduce Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Standard-Transitions:**
```css
.transition-all { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.animate-fade-in { animation: fade-in 0.5s ease-out; }
.animate-slide-up { animation: slide-up 0.5s ease-out; }
```

---

## C. Design Tokens

### Vollständige Token-Konfiguration

```json
{
  "colors": {
    "brand": {
      "primary": "hsl(213, 100%, 52%)",
      "primary-foreground": "hsl(0, 0%, 100%)"
    },
    "neutral": {
      "50": "hsl(220, 14%, 96%)",
      "100": "hsl(220, 13%, 91%)",
      "200": "hsl(220, 13%, 82%)",
      "300": "hsl(220, 9%, 60%)",
      "400": "hsl(220, 9%, 46%)",
      "500": "hsl(220, 9%, 32%)",
      "600": "hsl(220, 13%, 25%)",
      "700": "hsl(220, 14%, 20%)",
      "800": "hsl(220, 14%, 16%)",
      "900": "hsl(220, 16%, 13%)"
    },
    "status": {
      "success": "hsl(142, 76%, 36%)",
      "warning": "hsl(45, 100%, 50%)",
      "danger": "hsl(0, 84%, 60%)",
      "info": "hsl(210, 100%, 50%)"
    },
    "buffett": {
      "red": "#FF3B30",
      "yellow": "#FFCC00",
      "green": "#34C759",
      "blue": "#007AFF"
    }
  },
  "spacing": {
    "0": "0",
    "0.5": "0.125rem",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "6": "1.5rem",
    "8": "2rem",
    "12": "3rem",
    "18": "4.5rem"
  },
  "borderRadius": {
    "sm": "0.75rem",
    "md": "0.875rem",
    "lg": "1rem",
    "xl": "1.25rem",
    "2xl": "1.5rem",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
  },
  "typography": {
    "fontSizes": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "2rem"
    },
    "fontWeights": {
      "normal": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    },
    "lineHeights": {
      "tight": "1.2",
      "snug": "1.3",
      "normal": "1.5",
      "relaxed": "1.75"
    }
  },
  "zIndex": {
    "base": "0",
    "dropdown": "1000",
    "sticky": "1020",
    "fixed": "1030",
    "modal-backdrop": "1040",
    "modal": "1050",
    "popover": "1060",
    "tooltip": "1070"
  }
}
```

### Tailwind Config (Implementierung)
```typescript
// tailwind.config.ts
export default {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        // ... (siehe aktuelle tailwind.config.ts)
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
      },
      spacing: {
        '18': '4.5rem',
      }
    }
  }
}
```

---

## D. Komponenten-Bibliothek

### D.1 Button

**Zweck:** Primäre Interaktions-Trigger (Submit, Actions, Navigation)

**Anatomie:**
```tsx
<Button variant="default" size="default">
  <Icon /> {/* optional */}
  Label Text
</Button>
```

**Varianten:**

| Variant       | Background          | Text                 | Border          | Use-Case                |
|---------------|---------------------|----------------------|-----------------|-------------------------|
| `default`     | `primary`           | `primary-foreground` | -               | Primary Actions         |
| `secondary`   | `secondary`         | `secondary-foreground`| -              | Secondary Actions       |
| `outline`     | `transparent`       | `foreground`         | `border`        | Tertiary, Cancel        |
| `ghost`       | `transparent`       | `foreground`         | -               | Subtle, Icon-Only       |
| `destructive` | `destructive`       | `destructive-foreground`| -            | Delete, Remove          |
| `link`        | `transparent`       | `primary`            | -               | Text Links              |

**Größen:**

| Size       | Height | Padding      | Font-Size | Icon-Size |
|------------|--------|--------------|-----------|-----------|
| `sm`       | 36px   | `px-3`       | 14px      | 16px      |
| `default`  | 40px   | `px-4 py-2`  | 14px      | 20px      |
| `lg`       | 44px   | `px-8`       | 16px      | 20px      |
| `icon`     | 40px   | -            | -         | 20px      |

**States:**
- **Default:** Base styles
- **Hover:** `opacity-90`, subtle `shadow`
- **Focus:** `ring-2 ring-ring ring-offset-2`
- **Active:** `scale-[0.98]`
- **Disabled:** `opacity-50 pointer-events-none`
- **Loading:** Spinner + `pointer-events-none`

**Implementierung:**
```tsx
// src/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**A11y-Hinweise:**
- ✅ Mindest-Trefferfläche: 44×44px (iOS) / 40×40px (Desktop)
- ✅ Fokus-Ring immer sichtbar (nicht `outline-none` ohne `ring`)
- ✅ Loading-State: `aria-busy="true"`, deaktiviert während Ladung
- ✅ Icon-Only: `aria-label` Pflicht

**Copy-Guidelines:**
- Verb-basiert: "Analyse starten", "Speichern", "Abbrechen"
- Keine generischen "OK" / "Ja" – Kontext klar machen
- Max. 2-3 Wörter, außer erklärender Context nötig

---

### D.2 Input / Textarea / Select

**Zweck:** Daten-Eingabe, Suche, Formulare

**Anatomie:**
```tsx
<div className="space-y-2">
  <Label htmlFor="ticker">Ticker-Symbol</Label>
  <Input 
    id="ticker" 
    placeholder="z.B. AAPL" 
    aria-describedby="ticker-help"
  />
  <p id="ticker-help" className="text-sm text-muted-foreground">
    US-Aktien: ohne Suffix, Deutsche: .DE anhängen
  </p>
</div>
```

**States:**
- **Default:** `border-input bg-background`
- **Focus:** `ring-2 ring-ring border-ring`
- **Error:** `border-destructive text-destructive focus:ring-destructive`
- **Success:** `border-buffett-green focus:ring-buffett-green`
- **Disabled:** `opacity-50 cursor-not-allowed bg-muted`

**Helper Text:**
- **Neutral:** `text-muted-foreground` (Erklärung, Format-Hinweis)
- **Error:** `text-destructive` (Was ist falsch, wie beheben)
- **Success:** `text-buffett-green` (Bestätigung)

**Implementierung:**
```tsx
// src/components/ui/input.tsx
<input
  className={cn(
    "flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm",
    "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  ref={ref}
  {...props}
/>
```

**A11y-Hinweise:**
- ✅ `<Label>` immer mit `htmlFor` verknüpft
- ✅ Helper/Error-Text via `aria-describedby`
- ✅ Required: `aria-required="true"` + `*` im Label
- ✅ Error: `aria-invalid="true"`

**Copy-Guidelines:**
- **Label:** Klar, kurz ("Ticker-Symbol", nicht "Ticker")
- **Placeholder:** Beispiel, nicht Anweisung ("AAPL" statt "Ticker eingeben")
- **Helper:** Proaktive Hilfe ("Format: SYMBOL.EXCHANGE")
- **Error:** Problem + Lösung ("Ticker nicht gefunden – Schreibweise prüfen")

---

### D.3 Checkbox / Radio / Switch

**Zweck:** Binäre Auswahl, Optionen, Feature-Toggles

**Mindest-Trefferfläche:** 44×44px (iOS) / 40×40px (Desktop)

**Implementierung (Checkbox):**
```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="deep-research" />
  <label
    htmlFor="deep-research"
    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    KI-gestützte Tiefenanalyse aktivieren
  </label>
</div>
```

**A11y-Hinweise:**
- ✅ Native `<input type="checkbox">` oder vollständiges ARIA-Pattern
- ✅ Fokus-Ring: 2px, `ring-ring`
- ✅ Label klickbar (erweitert Trefferfläche)

---

### D.4 Tooltip / Popover / Modal

**Tooltip:**
- **Zweck:** Erklärung, Definitionen (max. 1-2 Sätze)
- **Trigger:** Hover (Desktop), Tap (Mobile mit expliziten "i"-Icon)
- **A11y:** `role="tooltip"`, `aria-describedby`

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <InfoIcon className="h-4 w-4" />
    </TooltipTrigger>
    <TooltipContent>
      <p>ROIC: Return on Invested Capital – Rentabilität des eingesetzten Kapitals</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Modal (Dialog):**
- **Zweck:** Kritische Entscheidungen, Formulare, Warnungen
- **Fokus-Trap:** Ja, ESC schließt
- **Backdrop:** `bg-black/50`, klickbar zum Schließen (außer criticals)
- **A11y:** `role="dialog"`, `aria-labelledby`, `aria-describedby`

**Sheet (Sidebar-Modal):**
- **Zweck:** Filter, Navigation, Detail-Views
- **Position:** Left/Right, Full-Height
- **Mobile:** Full-Screen Overlay

---

### D.5 Navigation (Navbar, Sidebar, Breadcrumbs)

**AppHeader (Navbar):**
- **Fixed:** `fixed top-0 left-0 right-0 z-50`
- **Height:** `72px` (4.5rem)
- **Glass:** `backdrop-blur-2xl bg-background/80`
- **Inhalt:** Logo + Search + Actions

**LeftNavigation (Sidebar):**
- **Desktop:** `fixed left-0 top-18 w-[280px] h-[calc(100vh-4.5rem)]`
- **Mobile:** Full-Screen Overlay, z-40, Slide-In-Transition
- **Active Route:** `nav-pill` (bg-primary/10, border-l-4)

**NavItem (Komponente):**
```tsx
<NavLink
  to="/analyzer"
  className={({ isActive }) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all',
      isActive
        ? 'nav-pill text-foreground font-medium'
        : 'text-muted-foreground hover:nav-pill-hover'
    )
  }
>
  <BarChart3 className="h-5 w-5" />
  <span>Analyzer</span>
</NavLink>
```

**A11y-Hinweise:**
- ✅ Skip-Link: "Zum Hauptinhalt springen" (erste Tastatur-Tab)
- ✅ `aria-current="page"` für aktive Route
- ✅ Tastatur-Navigation: Tab/Shift+Tab durchlaufen

---

### D.6 Card / List / Table

**Card:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Buffett-Score</CardTitle>
    <CardDescription>Qualität nach Value-Investing Prinzipien</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main Content */}
  </CardContent>
  <CardFooter>
    <Button>Details ansehen</Button>
  </CardFooter>
</Card>
```

**Styles:**
- `rounded-2xl border bg-card shadow-sm`
- Padding: `p-6`
- Hover: `hover:shadow-md transition-shadow`

**Table (für SavedAnalyses):**
- Responsive: Horizontal Scroll auf Mobile
- Header: `bg-muted/50 font-medium`
- Row Hover: `hover:bg-muted/50`
- Empty State: Custom Component (siehe D.10)

---

### D.7 Toast / Inline-Feedback

**Toast (Sonner):**
```tsx
import { toast } from 'sonner';

toast.success('Analyse gespeichert', {
  description: 'Ticker AAPL wurde deiner Watchlist hinzugefügt',
  duration: 4000,
});

toast.error('Ticker nicht gefunden', {
  description: 'Bitte Schreibweise überprüfen (z.B. AAPL, MSFT.DE)',
  action: {
    label: 'Hilfe',
    onClick: () => navigate('/help'),
  },
});
```

**Position:** Bottom-Right (Desktop), Bottom-Center (Mobile)

**A11y:**
- ✅ `role="status"` (nicht-kritisch) oder `role="alert"` (kritisch)
- ✅ `aria-live="polite"` / `"assertive"`

---

### D.8 Form-Muster (Validierung, Fehler)

**Validierung:**
- **Inline:** Nach Blur (nicht bei jedem Keystroke)
- **Submit:** Alle Fehler auf einmal anzeigen
- **Error-Zusammenfassung:** Oben im Formular (fokussierbar)

```tsx
<form onSubmit={handleSubmit}>
  {errors.length > 0 && (
    <Alert variant="destructive" className="mb-6">
      <AlertTitle>Bitte folgende Fehler beheben:</AlertTitle>
      <ul className="list-disc list-inside">
        {errors.map(err => <li key={err.field}>{err.message}</li>)}
      </ul>
    </Alert>
  )}
  
  {/* Form Fields */}
</form>
```

**A11y:**
- ✅ Fehler-Zusammenfassung: `tabindex="0"` + fokussiert nach Submit
- ✅ Erste fehlerhafte Feld automatisch fokussieren

---

### D.9 Loading States

**Skeleton:**
```tsx
<Skeleton className="h-20 w-full rounded-2xl" />
```

**Spinner:**
```tsx
<div className="flex items-center justify-center py-8">
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
  <span className="ml-3 text-muted-foreground">Analyse wird geladen...</span>
</div>
```

**Progressive Loading:**
- Skeleton für bekannte Layout-Struktur
- Spinner für unbestimmte Dauer
- Progress Bar für mehrstufige Prozesse (QuantAnalyzer)

---

### D.10 Empty States

**Komponente:**
```tsx
<EmptyState
  icon={FileText}
  title="Noch keine Analysen gespeichert"
  description="Speichere deine erste Aktienanalyse, um sie später wiederzufinden"
  action={
    <Button onClick={() => navigate('/analyzer')}>
      <PlusIcon className="mr-2 h-4 w-4" />
      Erste Analyse erstellen
    </Button>
  }
/>
```

**Copy-Guidelines:**
- **Title:** Zustand beschreiben (nicht "Leer")
- **Description:** Nächster Schritt anbieten
- **Action:** CTA für Aktivierung

---

## E. Layout- & Responsive-Regeln

### Container-Breiten (nach Use-Case)

| Layout              | Max-Width  | Use-Case                          |
|---------------------|------------|-----------------------------------|
| **Narrow**          | 640px      | Auth, Formulare                   |
| **Standard**        | 1024px     | Analyzer-Results, Detail-Views    |
| **Wide**            | 1440px     | Dashboards, Multi-Column          |

### Standard-Layouts

**Dashboard:**
```tsx
<Shell maxWidth="2xl">
  <ShellHeader>
    <ShellTitle>Dashboard</ShellTitle>
    <ShellDescription>Überblick über deine Analysen und Watchlists</ShellDescription>
  </ShellHeader>
  <ShellContent>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Cards */}
    </div>
  </ShellContent>
</Shell>
```

**Detail-Page (Analyzer):**
```tsx
<main className="pt-18 md:ml-[280px] px-4 md:px-8 py-8">
  <div className="max-w-screen-lg mx-auto">
    <StockHeader />
    <Tabs>...</Tabs>
  </div>
</main>
```

### Responsive-Breakpoints

| Breakpoint | Width | Layout-Änderungen                 |
|------------|-------|-----------------------------------|
| **xs**     | 480px | Button Full-Width → Auto          |
| **sm**     | 640px | Single Column → 2 Columns (Cards) |
| **md**     | 768px | Mobile Nav → Sidebar sichtbar     |
| **lg**     | 1024px| 2 Columns → 3 Columns (Dashboard) |
| **xl**     | 1280px| Max-Width Expansion               |

---

## F. Interaktion & States

### Fokus-Management

**Reihenfolge:**
1. Skip-Link (unsichtbar bis Fokus)
2. Header (Logo, Search, Actions)
3. Sidebar Navigation
4. Main Content (logische Tab-Order)

**Fokus-Styles:**
```css
focus-visible:outline-none 
focus-visible:ring-2 
focus-visible:ring-ring 
focus-visible:ring-offset-2
```

**Skip-Link:**
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-2xl"
>
  Zum Hauptinhalt springen
</a>
```

---

### Hover / Active / Pressed

| Element    | Hover                     | Active              | Visited (Links) |
|------------|---------------------------|---------------------|-----------------|
| Button     | `opacity-90`, `shadow`    | `scale-[0.98]`      | -               |
| Link       | `underline`               | -                   | `text-purple-600`|
| Card       | `shadow-md`               | -                   | -               |
| Nav-Item   | `nav-pill-hover`          | -                   | -               |

---

### Fehler-Recovery

**Fehlerseiten:**
- **404 (Not Found):** "Seite nicht gefunden – Zurück zur Startseite"
- **500 (Server Error):** "Etwas ist schiefgelaufen – Bitte versuche es später erneut"
- **403 (Unauthorized):** "Zugriff verweigert – Bitte melde dich an"

**Inline-Fehler:**
- Problem klar benennen
- Nächsten Schritt vorschlagen
- Kontakt/Hilfe-Link bei komplexen Fehlern

---

## G. Content & Microcopy

### Stil-Regeln

**Ansprache:** Du (durchgehend)
**Terminologie:**
- "Ticker" (nicht "Symbol")
- "Analyse" (nicht "Report")
- "Watchlist" (nicht "Portfolio" – verwechselbar mit realen Käufen)
- "Speichern" (nicht "Sichern")

**Länge:**
- Button: 1-3 Wörter
- Tooltip: 1-2 Sätze
- Helper-Text: 1 Satz
- Error-Message: Problem + Lösung (2 Sätze)

**BaFin-Compliance:**
- ✅ "Dies ist keine Anlageberatung"
- ✅ "Vergangene Performance garantiert keine zukünftigen Erträge"
- ✅ "Eigenverantwortliche Entscheidung erforderlich"
- ❌ "Garantiert", "Sicher", "Risikolos"

---

### Komponenten-Textbausteine

**Buttons:**
- Primary: "Analyse starten", "Speichern", "Hinzufügen"
- Secondary: "Details ansehen", "Bearbeiten"
- Tertiary: "Abbrechen", "Zurück"
- Destructive: "Löschen", "Entfernen"

**Tooltips (Fachbegriffe):**
- ROIC: "Return on Invested Capital – misst die Rentabilität des eingesetzten Kapitals"
- DCF: "Discounted Cash Flow – Unternehmensbewertung basierend auf zukünftigen Cashflows"
- P/E: "Kurs-Gewinn-Verhältnis – Aktienkurs geteilt durch Gewinn pro Aktie"

**Fehlermeldungen:**
- "Ticker nicht gefunden – Bitte Schreibweise prüfen (z.B. AAPL, MSFT.DE)"
- "API-Limit erreicht – Bitte in 1 Minute erneut versuchen"
- "Verbindung fehlgeschlagen – Internetverbindung prüfen"

---

## H. Qualitäts-Checkliste

Vor jeder Auslieferung (Component, Page, Feature) abhaken:

- [ ] **Kontrast:** Alle Text-Kombinationen ≥ 4.5:1 (WebAIM Contrast Checker)
- [ ] **Fokus:** Fokus-Ring bei allen interaktiven Elementen sichtbar
- [ ] **Tastatur:** Gesamte Seite ohne Maus bedienbar (Tab, Enter, ESC)
- [ ] **Screenreader:** Semantische HTML, ARIA-Labels, Live-Regions
- [ ] **Responsivität:** Getestet ab 320px (iPhone SE) bis 1920px
- [ ] **Tokens:** Keine Inline-Farben, alle via `hsl(var(--token))`
- [ ] **Loading:** Skeleton/Spinner für alle Async-Operationen
- [ ] **Empty:** EmptyState für leere Listen/Tabellen
- [ ] **Error:** Fehlerbehandlung mit klarem Recovery-Pfad
- [ ] **Copy:** Alle Texte professionell-freundlich, erklärender Stil
- [ ] **BaFin:** Risikohinweise bei Finanz-Daten/-Empfehlungen
- [ ] **i18n-Ready:** Texte extrahierbar, Datums-/Zahlenformate konfigurierbar

---

## I. Beispielseite: Dashboard

### Wireframe (Text)
```
+----------------------------------------------------------+
| [Logo] [Search___________________________] [Avatar]      |
+----------------------------------------------------------+
| [Sidebar]  | Dashboard                                     |
|            | Überblick über deine Analysen und Watchlists|
| - Dashboard|                                               |
| - Analyzer | [Grid: 3 Columns]                             |
| - Scanner  | [Card: Letzte Analysen]                       |
| - Watchl.  | - AAPL (01.10.2025)                           |
|            | - MSFT (28.09.2025)                           |
|            |                                               |
|            | [Card: Watchlists]                            |
|            | - Tech-Stocks (12 Titel)                      |
|            | - Dividenden (8 Titel)                        |
|            |                                               |
|            | [Card: Quick Actions]                         |
|            | [Button: Neue Analyse]                        |
+----------------------------------------------------------+
```

### Komponentenliste
1. `AppHeader` (Logo, StockSearch, UserAvatar)
2. `LeftNavigation` (NavItems, UserSection)
3. `Shell` (Container)
4. `ShellHeader` (Title, Description)
5. `Card` × 3 (RecentAnalyses, Watchlists, QuickActions)
6. `EmptyState` (falls keine Analysen)
7. `Button` (Primary CTA)

### Copy-Beispiele
- **Title:** "Dashboard"
- **Description:** "Überblick über deine Analysen und Watchlists"
- **Card Titles:** "Letzte Analysen", "Deine Watchlists", "Schnellzugriff"
- **Empty:** "Noch keine Analysen gespeichert – Erstelle deine erste Analyse im Analyzer"
- **Button:** "Neue Analyse starten"

### Tab-Reihenfolge
1. Skip-Link (unsichtbar)
2. Mobile Menu Toggle (nur Mobile)
3. Logo (Navigierbar)
4. StockSearch Input
5. User Avatar (Dropdown-Trigger)
6. Sidebar NavItems (Dashboard, Analyzer, Scanner, Watchlists)
7. Main Content (Cards, Buttons)

---

## J. Handover & Änderungslog

### Lieferbare
1. **Design Tokens:** `DESIGN_CANON.md` (dieses Dokument)
2. **Komponenten:** `src/components/ui/*` (shadcn/ui + Custom)
3. **Checkliste:** Abschnitt H (vor jedem Commit prüfen)
4. **Implementierungs-Guidelines:** Inline-Code-Snippets in Abschnitten D-G

### Änderungslog

| Version | Datum      | Änderung                                  | Grund                          |
|---------|------------|-------------------------------------------|--------------------------------|
| v1.0    | 2025-10-01 | Initial Release                           | Basis-Canon etabliert          |

---

## Design Canon v1.0 (Kompakte Bulletliste)

**Verbindliche Regeln – IMMER anwenden (außer "Override"):**

1. **Farben:** Nur HSL-Tokens (`hsl(var(--token))`), keine Inline-Hex/RGB
2. **Typografie:** SF Pro Display, 16px Minimum (Body), semantische Rollen
3. **Spacing:** 8pt-Raster (4pt für Details), `rem` statt `px`
4. **Radius:** `rounded-2xl` (1rem) Standard, `rounded-lg` für Inputs
5. **A11y:** WCAG 2.2 AA, Fokus-Ring Pflicht, Tastatur-Navigation vollständig
6. **Copy:** Du-Form, professionell-freundlich, erklärender Stil
7. **BaFin:** Risikohinweise bei Finanz-Daten, keine Garantie-Versprechen
8. **Responsive:** Mobile First, ab 320px, Breakpoints xs/sm/md/lg/xl
9. **Motion:** 100-500ms, `ease-out`, `prefers-reduced-motion` respektieren
10. **Komponenten:** shadcn/ui-Basis, erweitert mit Custom-Varianten
11. **Leerzustände:** EmptyState-Component mit Icon + Beschreibung + CTA
12. **Fehler:** Problem + Lösung + Recovery-Pfad
13. **Loading:** Skeleton (bekanntes Layout) oder Spinner (unbestimmt)
14. **i18n:** Texte extrahierbar, Datum/Zahlen formatierbar (DE: `1.234,56 €`)
15. **Dark Mode:** Alle Tokens haben Light/Dark-Varianten

**Bei Konflikten:** Diese Canon gewinnt über externe Guidelines (außer WCAG).

**Änderungen:** Nur via explizitem "Override: <Beschreibung>" vom Auftraggeber.

---

**Ende Design Canon v1.0**
