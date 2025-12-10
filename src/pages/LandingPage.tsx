import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, Search, BarChart3, Target, CheckCircle } from "lucide-react";
import { HowItWorksSection } from "@/components/HowItWorksSection";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Aesy</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/analyzer">
              <Button variant="outline">Zum Tool</Button>
            </Link>
            <Link to="/auth">
              <Button>Kostenlos starten</Button>
            </Link>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="w-full text-center">
          <Badge variant="secondary" className="mb-4">
            Basierend auf Warren Buffetts Prinzipien
          </Badge>
          <h2 className="text-5xl font-bold text-foreground mb-6">Bewerte Aktien wie Warren Buffett</h2>
          <p className="text-xl text-muted-foreground mb-8 w-full text-center">
            Nutze bewährte Investmentprinzipien des erfolgreichsten Investors der Welt. Analysiere Aktien systematisch
            nach Quality, Valuation und Margin of Safety.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link to="/analyzer">
              <Button size="lg" className="px-8">
                Tool kostenlos testen
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              <Link to="/auth">Mehr erfahren</Link>
            </Button>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="w-full">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">Aesy</h3>
            <p className="text-muted-foreground w-full text-center">
              Alle wichtigen Kennzahlen und Analysen nach bewährten Methoden
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Quality Analyse</CardTitle>
                <CardDescription>ROE, Debt-to-Equity, Current Ratio und weitere Qualitäts-Metriken</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Return on Equity (ROE)
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Verschuldungsgrad
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Liquiditätskennzahlen
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Valuation Metriken</CardTitle>
                <CardDescription>P/E Ratio, P/B Ratio, DCF Analyse und Bewertungs-Kennzahlen</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Price-to-Earnings Ratio
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Discounted Cash Flow
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Book Value Analyse
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Target className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Margin of Safety</CardTitle>
                <CardDescription>
                  Bestimme den fairen Wert und die Sicherheitsmarge für deine Investments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Fair Value Berechnung
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Sicherheitsmarge
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Buy/Hold/Sell Empfehlung
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* How it works */}
      <section className="py-20 px-6">
        <div className="w-full">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">So funktioniert's</h3>
            <p className="text-muted-foreground">In 3 einfachen Schritten zur professionellen Aktienanalyse</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-2">1. Aktie eingeben</h4>
              <p className="text-muted-foreground">
                Gib einfach den Ticker oder Namen der Aktie ein, die du analysieren möchtest
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-2">2. Automatische Analyse</h4>
              <p className="text-muted-foreground">
                Das Tool analysiert automatisch alle wichtigen Kennzahlen nach Buffetts Kriterien
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-2">3. Investment Entscheidung</h4>
              <p className="text-muted-foreground">
                Erhalte eine klare Bewertung und Handlungsempfehlung für dein Investment
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary">
        <div className="w-full text-center">
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Starte noch heute mit professioneller Aktienanalyse
          </h3>
          <p className="text-primary-foreground/80 mb-8 w-full text-center">
            Nutze die bewährten Prinzipien von Warren Buffett für deine Investment-Entscheidungen
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="px-8">
              Kostenloses Tool testen
            </Button>
          </Link>
        </div>
      </section>
      // Dann im JSX vor dem Footer einfügen:
      <HowItWorksSection className="container mx-auto px-4" />
      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="w-full">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span className="font-bold text-foreground">Aesy</span>
              </div>
              <p className="text-muted-foreground text-sm">Professionelle Aktienanalyse nach bewährten Prinzipien</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/analyzer" className="hover:text-foreground">
                    Buffett Tool
                  </Link>
                </li>
                <li>
                  <Link to="/watchlists" className="hover:text-foreground">
                    Watchlists
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Unternehmen</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">
                    Über uns
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Kontakt
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">
                    Datenschutz
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Impressum
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 mt-8 text-center text-sm text-muted-foreground">
            © 2024 Aesy. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
