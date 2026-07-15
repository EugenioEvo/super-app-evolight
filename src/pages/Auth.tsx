import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { ForgotPasswordLink } from '@/components/ForgotPasswordLink';

type Mode = 'login' | 'signup';

const Auth = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      toast.success('Login realizado com sucesso!', { description: 'Bem-vindo de volta.' });
      navigate('/');
    } catch (error: unknown) {
      const raw = error instanceof Error ? error.message : '';
      // Mensagem amigável para os casos mais comuns do GoTrue
      let description = 'Verifique e-mail e senha e tente novamente.';
      if (/invalid login credentials/i.test(raw)) description = 'E-mail ou senha incorretos.';
      else if (/email not confirmed/i.test(raw)) description = 'E-mail ainda não confirmado.';
      else if (raw) description = raw;
      toast.error('Não foi possível entrar', { description });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;

      // Se já veio sessão (confirmação de e-mail desativada), provisiona o perfil e entra.
      if (data.session) {
        await supabase.functions.invoke('create-user-profile').catch(() => {
          /* o perfil também é criado no primeiro acesso; erro aqui não bloqueia */
        });
        toast.success('Conta criada!', { description: 'Bem-vindo ao SunFlow.' });
        navigate('/');
        return;
      }

      // Caso a confirmação por e-mail esteja ativa.
      toast.success('Conta criada', {
        description: 'Confirme seu e-mail para ativar o acesso e depois faça login.',
      });
      setMode('login');
    } catch (error: unknown) {
      const raw = error instanceof Error ? error.message : '';
      let description = 'Não foi possível concluir o cadastro.';
      if (/already registered|already been registered|user already exists/i.test(raw))
        description = 'Este e-mail já tem cadastro. Use "Entrar".';
      else if (/password/i.test(raw) && /least|weak|6/i.test(raw))
        description = 'A senha deve ter ao menos 6 caracteres.';
      else if (raw) description = raw;
      toast.error('Erro no cadastro', { description });
    } finally {
      setLoading(false);
    }
  };

  const passwordField = (
    <div className="space-y-2">
      <Label htmlFor="password">Senha</Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  const emailField = (
    <div className="space-y-2">
      <Label htmlFor="email">E-mail</Label>
      <Input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        placeholder="seu@email.com"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <Zap className="h-8 w-8 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              SunFlow
            </span>
          </div>
          <CardTitle>{mode === 'login' ? 'Entrar' : 'Criar conta'}</CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Entre com suas credenciais para acessar o sistema'
              : 'Cadastre-se para acessar a plataforma'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {emailField}
                {passwordField}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
                <ForgotPasswordLink />
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Seu nome"
                  />
                </div>
                {emailField}
                {passwordField}
                <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="pt-4 mt-4 border-t text-center text-sm">
            <p className="text-muted-foreground">
              Quer ser prestador?{' '}
              <button
                type="button"
                onClick={() => navigate('/candidatar-se')}
                className="text-primary underline-offset-4 hover:underline font-medium"
              >
                Candidate-se aqui
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
