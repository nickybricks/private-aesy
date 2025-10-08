import React from 'react';
import { Shell, ShellHeader, ShellTitle, ShellDescription, ShellContent } from '@/components/layout/Shell';
import { Section, SectionHeader, SectionTitle, SectionDescription } from '@/components/layout/Section';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Star, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const DesignSystem = () => {
  return (
    <Shell maxWidth="2xl">
      <ShellHeader>
        <ShellTitle>Design System</ShellTitle>
        <ShellDescription>
          Alle Designmerkmale, Komponenten und Richtlinien für Aesy
        </ShellDescription>
      </ShellHeader>

      <ShellContent>
        {/* Colors Section */}
        <Section variant="raised" padding="lg">
          <SectionHeader>
            <SectionTitle as="h2">Farben</SectionTitle>
            <SectionDescription>
              Alle Farben basieren auf HSL-Werten und sind in Light/Dark Mode verfügbar
            </SectionDescription>
          </SectionHeader>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3">Primary Colors</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-background border-2 border-border"></div>
                  <p className="text-xs font-medium">background</p>
                  <p className="text-xs text-muted-foreground">Haupthintergrund</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-foreground"></div>
                  <p className="text-xs font-medium">foreground</p>
                  <p className="text-xs text-muted-foreground">Haupttext</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-primary"></div>
                  <p className="text-xs font-medium">primary</p>
                  <p className="text-xs text-muted-foreground">Hauptfarbe</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-secondary"></div>
                  <p className="text-xs font-medium">secondary</p>
                  <p className="text-xs text-muted-foreground">Sekundärfarbe</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Feedback Colors</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-destructive"></div>
                  <p className="text-xs font-medium">destructive</p>
                  <p className="text-xs text-muted-foreground">Fehler, Warnungen</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-[hsl(var(--status-green))]"></div>
                  <p className="text-xs font-medium">status-green</p>
                  <p className="text-xs text-muted-foreground">Erfolg, Pass</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-[hsl(var(--status-yellow))]"></div>
                  <p className="text-xs font-medium">status-yellow</p>
                  <p className="text-xs text-muted-foreground">Warnung</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-[hsl(var(--status-red))]"></div>
                  <p className="text-xs font-medium">status-red</p>
                  <p className="text-xs text-muted-foreground">Fail, Kritisch</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Aktienkurs-Farben</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-[hsl(var(--stock-green))]"></div>
                  <p className="text-xs font-medium">stock-green</p>
                  <p className="text-xs text-muted-foreground">Positive Kursentwicklung</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-[hsl(var(--stock-red))]"></div>
                  <p className="text-xs font-medium">stock-red</p>
                  <p className="text-xs text-muted-foreground">Negative Kursentwicklung</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-[hsl(var(--stock-yellow))]"></div>
                  <p className="text-xs font-medium">stock-yellow</p>
                  <p className="text-xs text-muted-foreground">Neutrale/Stagnierende Entwicklung</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">UI Elements</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-card border-2 border-border"></div>
                  <p className="text-xs font-medium">card</p>
                  <p className="text-xs text-muted-foreground">Karten-Hintergrund</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-muted"></div>
                  <p className="text-xs font-medium">muted</p>
                  <p className="text-xs text-muted-foreground">Sekundäre Elemente</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl bg-accent"></div>
                  <p className="text-xs font-medium">accent</p>
                  <p className="text-xs text-muted-foreground">Hover-States</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-2xl border-2 border-border"></div>
                  <p className="text-xs font-medium">border</p>
                  <p className="text-xs text-muted-foreground">Rahmen</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Typography Section */}
        <Section variant="raised" padding="lg">
          <SectionHeader>
            <SectionTitle as="h2">Typography</SectionTitle>
            <SectionDescription>
              Font Stack: -apple-system, SF Pro Display, Inter, system-ui
            </SectionDescription>
          </SectionHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">H1 - 3xl (30px) / 4xl (36px) MD</p>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Hauptüberschrift für Seiten
                </h1>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">H2 - xl (20px) / 2xl (24px) MD</p>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                  Section-Überschrift
                </h2>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">H3 - lg (18px)</p>
                <h3 className="text-lg font-semibold tracking-tight">
                  Unterüberschrift
                </h3>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Body - base (16px)</p>
                <p className="text-base">
                  Standard-Fließtext für Beschreibungen und Inhalte
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Small - sm (14px)</p>
                <p className="text-sm">
                  Kleinerer Text für zusätzliche Informationen
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Caption - xs (12px)</p>
                <p className="text-xs text-muted-foreground">
                  Sehr kleine Texte, Labels, Metadaten
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Font Weights</h4>
              <div className="space-y-2">
                <p className="font-normal">Normal (400) - Standardtext</p>
                <p className="font-medium">Medium (500) - Hervorgehobener Text</p>
                <p className="font-semibold">Semibold (600) - Überschriften</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Buttons Section */}
        <Section variant="raised" padding="lg">
          <SectionHeader>
            <SectionTitle as="h2">Buttons</SectionTitle>
            <SectionDescription>
              Alle Button-Varianten mit rounded-2xl (16px Radius)
            </SectionDescription>
          </SectionHeader>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3">Variants</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Sizes</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Heart className="h-4 w-4" /></Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">With Icons</h4>
              <div className="flex flex-wrap gap-3">
                <Button>
                  <Star className="mr-2 h-4 w-4" />
                  With Icon
                </Button>
                <Button variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analyze
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">States</h4>
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button className="pointer-events-none opacity-50">Loading...</Button>
              </div>
            </div>
          </div>
        </Section>

        {/* Cards Section */}
        <Section variant="raised" padding="lg">
          <SectionHeader>
            <SectionTitle as="h2">Cards</SectionTitle>
            <SectionDescription>
              Card-Komponenten mit rounded-2xl und shadow-sm
            </SectionDescription>
          </SectionHeader>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>
                  Eine Beschreibung der Card mit text-muted-foreground
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Card Content mit allen möglichen Inhalten
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Glass Card</CardTitle>
                <CardDescription>
                  Mit Glassmorphism-Effekt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Transparente Karte mit Backdrop-Blur
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Badges Section */}
        <Section variant="raised" padding="lg">
          <SectionHeader>
            <SectionTitle as="h2">Badges</SectionTitle>
            <SectionDescription>
              Status-Badges für verschiedene Zustände
            </SectionDescription>
          </SectionHeader>

          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-[hsl(var(--status-green))] text-white">Pass</Badge>
            <Badge className="bg-[hsl(var(--status-yellow))] text-white">Warning</Badge>
            <Badge className="bg-[hsl(var(--status-red))] text-white">Fail</Badge>
          </div>
        </Section>

        {/* Inputs Section */}
        <Section variant="raised" padding="lg">
          <SectionHeader>
            <SectionTitle as="h2">Form Elements</SectionTitle>
            <SectionDescription>
              Input-Felder mit rounded-2xl
            </SectionDescription>
          </SectionHeader>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-sm font-medium mb-2 block">Label</label>
              <Input placeholder="Placeholder Text" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Disabled</label>
              <Input placeholder="Disabled Input" disabled />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Error State
              </label>
              <Input 
                placeholder="Error Input" 
                className="border-destructive focus-visible:ring-destructive"
              />
              <p className="text-xs text-destructive mt-1">Dies ist eine Fehlermeldung</p>
            </div>
          </div>
        </Section>

        {/* Icons Section */}
        <Section variant="raised" padding="lg">
          <SectionHeader>
            <SectionTitle as="h2">Icons</SectionTitle>
            <SectionDescription>
              Lucide React Icons in verschiedenen Größen
            </SectionDescription>
          </SectionHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-4 w-4 text-[hsl(var(--status-green))]" />
              <span className="text-sm">h-4 w-4 (16px) - Standard für Buttons</span>
            </div>
            <div className="flex items-center gap-4">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-sm">h-5 w-5 (20px) - Navigation</span>
            </div>
            <div className="flex items-center gap-4">
              <TrendingUp className="h-6 w-6 text-foreground" />
              <span className="text-sm">h-6 w-6 (24px) - Größere Icons</span>
            </div>
            <div className="flex items-center gap-4">
              <XCircle className="h-8 w-8 text-[hsl(var(--status-red))]" />
              <span className="text-sm">h-8 w-8 (32px) - Große Icons</span>
            </div>
          </div>
        </Section>

        {/* Spacing Section */}
        <Section variant="raised" padding="lg">
          <SectionHeader>
            <SectionTitle as="h2">Spacing & Layout</SectionTitle>
            <SectionDescription>
              8pt/4pt Grid-System mit Tailwind-Klassen
            </SectionDescription>
          </SectionHeader>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3">Common Spacing</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-8 bg-primary rounded"></div>
                  <span className="text-sm">2 (8px) - Sehr kleiner Abstand</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-8 bg-primary rounded"></div>
                  <span className="text-sm">4 (16px) - Kleiner Abstand</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-6 h-8 bg-primary rounded"></div>
                  <span className="text-sm">6 (24px) - Standard-Abstand</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary rounded"></div>
                  <span className="text-sm">8 (32px) - Großer Abstand</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Container Max-Width</h4>
              <ul className="space-y-2 text-sm">
                <li>• sm: 640px - Narrow Content</li>
                <li>• md: 768px - Standard Forms</li>
                <li>• lg: 1024px - Standard Content</li>
                <li>• xl: 1280px - Wide Content</li>
                <li>• 2xl: 1440px - Dashboard (Standard)</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Border Radius Section */}
        <Section variant="raised" padding="lg">
          <SectionHeader>
            <SectionTitle as="h2">Border Radius</SectionTitle>
            <SectionDescription>
              Konsistente Rundungen für alle Komponenten
            </SectionDescription>
          </SectionHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary rounded-sm"></div>
              <span className="text-sm">rounded-sm (2px) - Minimal</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary rounded-md"></div>
              <span className="text-sm">rounded-md (6px) - Klein</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary rounded-lg"></div>
              <span className="text-sm">rounded-lg (8px) - Medium</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary rounded-xl"></div>
              <span className="text-sm">rounded-xl (12px) - Large</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary rounded-2xl"></div>
              <span className="text-sm">rounded-2xl (16px) - Standard für Buttons, Cards</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary rounded-full"></div>
              <span className="text-sm">rounded-full - Kreise, Avatare</span>
            </div>
          </div>
        </Section>

        {/* Shadows Section */}
        <Section variant="raised" padding="lg">
          <SectionHeader>
            <SectionTitle as="h2">Shadows</SectionTitle>
            <SectionDescription>
              Elevation und Tiefe durch Schatten
            </SectionDescription>
          </SectionHeader>

          <div className="space-y-4">
            <div className="p-6 bg-card rounded-2xl shadow-sm">
              <p className="text-sm font-medium">shadow-sm</p>
              <p className="text-xs text-muted-foreground">Leichter Schatten für Cards</p>
            </div>
            <div className="p-6 bg-card rounded-2xl shadow">
              <p className="text-sm font-medium">shadow</p>
              <p className="text-xs text-muted-foreground">Standard-Schatten</p>
            </div>
            <div className="p-6 bg-card rounded-2xl shadow-md">
              <p className="text-sm font-medium">shadow-md</p>
              <p className="text-xs text-muted-foreground">Mittlerer Schatten</p>
            </div>
            <div className="p-6 bg-card rounded-2xl shadow-lg">
              <p className="text-sm font-medium">shadow-lg</p>
              <p className="text-xs text-muted-foreground">Großer Schatten für Popups</p>
            </div>
          </div>
        </Section>

        {/* Design Principles */}
        <Section variant="raised" padding="lg">
          <SectionHeader>
            <SectionTitle as="h2">Design-Prinzipien</SectionTitle>
            <SectionDescription>
              Wichtige Richtlinien für konsistentes Design
            </SectionDescription>
          </SectionHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-2xl">
              <h4 className="font-semibold mb-2">1. Verwende immer semantische Token</h4>
              <p className="text-sm text-muted-foreground">
                Niemals direkte Farben wie text-white oder bg-black verwenden. 
                Immer HSL-basierte Design Tokens aus index.css nutzen.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl">
              <h4 className="font-semibold mb-2">2. Konsistente Border Radius</h4>
              <p className="text-sm text-muted-foreground">
                Alle interaktiven Elemente (Buttons, Cards, Inputs) nutzen rounded-2xl (16px).
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl">
              <h4 className="font-semibold mb-2">3. 8pt Grid-System</h4>
              <p className="text-sm text-muted-foreground">
                Alle Abstände basieren auf 4px oder 8px Inkrementen für visuelles Alignment.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl">
              <h4 className="font-semibold mb-2">4. Accessibility First</h4>
              <p className="text-sm text-muted-foreground">
                Minimum 4.5:1 Kontrast-Ratio für Text, Touch-Targets mindestens 44x44px.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl">
              <h4 className="font-semibold mb-2">5. Responsive Design</h4>
              <p className="text-sm text-muted-foreground">
                Mobile-First-Ansatz mit Breakpoints: xs (475px), sm (640px), md (768px), lg (1024px), xl (1280px).
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl">
              <h4 className="font-semibold mb-2">6. Dark Mode Support</h4>
              <p className="text-sm text-muted-foreground">
                Alle Komponenten müssen in Light und Dark Mode funktionieren und getestet sein.
              </p>
            </div>
          </div>
        </Section>
      </ShellContent>
    </Shell>
  );
};

export default DesignSystem;
