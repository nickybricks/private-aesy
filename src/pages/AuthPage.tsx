import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const { signIn, signUp, resetPassword, updatePassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/analyzer');
    }
  }, [user, navigate]);

  // Check for password reset parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');
    
    if (type === 'recovery' && accessToken && refreshToken) {
      // Set the session from URL parameters for password recovery
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(() => {
        setShowUpdatePassword(true);
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (!error) {
      navigate('/analyzer');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signUp(email, password);
    if (!error) {
      setActiveTab('signin');
      setPassword('');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      return;
    }
    const { error } = await resetPassword(email);
    if (!error) {
      setShowForgotPassword(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwörter stimmen nicht überein",
        description: "Bitte stelle sicher, dass beide Passwörter identisch sind."
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        variant: "destructive", 
        title: "Passwort zu kurz",
        description: "Das Passwort muss mindestens 6 Zeichen lang sein."
      });
      return;
    }
    const { error } = await updatePassword(newPassword);
    if (!error) {
      setShowUpdatePassword(false);
      navigate('/analyzer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Buffett Benchmark</h1>
          </Link>
          <Link to="/">
            <Button variant="outline">Zurück zur Startseite</Button>
          </Link>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Willkommen zurück
            </h2>
            <p className="text-muted-foreground">
              Melde dich an oder erstelle einen kostenlosen Account
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Anmelden</TabsTrigger>
              <TabsTrigger value="signup">Registrieren</TabsTrigger>
            </TabsList>

            {showUpdatePassword ? (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Neues Passwort festlegen</CardTitle>
                  <CardDescription>
                    Gib dein neues Passwort ein
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdatePassword}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Neues Passwort</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Mindestens 6 Zeichen"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10 pr-10"
                          minLength={6}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Passwort wiederholen"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10"
                          minLength={6}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Passwort aktualisieren
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            ) : showForgotPassword ? (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Passwort zurücksetzen</CardTitle>
                  <CardDescription>
                    Gib deine E-Mail-Adresse ein, um einen Reset-Link zu erhalten
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleForgotPassword}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">E-Mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="deine@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex space-x-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Reset-Link senden
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForgotPassword(false)}
                      disabled={loading}
                    >
                      Zurück
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            ) : (
              <>
                <TabsContent value="signin">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bei deinem Account anmelden</CardTitle>
                      <CardDescription>
                        Gib deine E-Mail und dein Passwort ein
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignIn}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email">E-Mail</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signin-email"
                              type="email"
                              placeholder="deine@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signin-password">Passwort</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signin-password"
                              type={showSignInPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 pr-10"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                              onClick={() => setShowSignInPassword(!showSignInPassword)}
                            >
                              {showSignInPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col space-y-2">
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Anmelden
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          className="text-sm"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Passwort vergessen?
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>

                <TabsContent value="signup">
                  <Card>
                    <CardHeader>
                      <CardTitle>Kostenlosen Account erstellen</CardTitle>
                      <CardDescription>
                        Starte noch heute mit professioneller Aktienanalyse
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignUp}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">E-Mail</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="deine@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Passwort</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              type={showSignUpPassword ? "text" : "password"}
                              placeholder="Mindestens 6 Zeichen"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 pr-10"
                              minLength={6}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                              onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                            >
                              {showSignUpPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Kostenlosen Account erstellen
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Mit der Anmeldung stimmst du unseren{' '}
              <a href="#" className="text-primary hover:underline">
                Nutzungsbedingungen
              </a>{' '}
              und{' '}
              <a href="#" className="text-primary hover:underline">
                Datenschutzbestimmungen
              </a>{' '}
              zu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;