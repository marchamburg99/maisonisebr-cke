import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_CREDENTIALS } from '@/lib/mockData';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const success = await login(email, password);

        if (success) {
            toast({
                title: 'Willkommen!',
                description: 'Sie wurden erfolgreich angemeldet.',
            });
            navigate('/');
        } else {
            toast({
                title: 'Anmeldung fehlgeschlagen',
                description: 'E-Mail oder Passwort ist falsch.',
                variant: 'destructive',
            });
        }

        setIsLoading(false);
    };

    const fillDemoCredentials = (role: 'admin' | 'manager' | 'staff') => {
        setEmail(DEMO_CREDENTIALS[role].email);
        setPassword(DEMO_CREDENTIALS[role].password);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-4">
                        <UtensilsCrossed className="h-8 w-8 text-amber-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">GastroWWS</h1>
                    <p className="text-slate-400 mt-2">Restaurant Warenwirtschaftssystem</p>
                </div>

                {/* Login Card */}
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-white">Anmelden</CardTitle>
                        <CardDescription className="text-slate-400">
                            Geben Sie Ihre Zugangsdaten ein
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">E-Mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@restaurant.de"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Passwort</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Anmelden...
                                    </>
                                ) : (
                                    'Anmelden'
                                )}
                            </Button>
                        </form>

                        {/* Demo Credentials */}
                        <div className="mt-6 pt-6 border-t border-slate-700">
                            <p className="text-sm text-slate-400 mb-3">Demo-Zugangsdaten:</p>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                                    onClick={() => fillDemoCredentials('admin')}
                                >
                                    Admin
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                                    onClick={() => fillDemoCredentials('manager')}
                                >
                                    Manager
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                                    onClick={() => fillDemoCredentials('staff')}
                                >
                                    Mitarbeiter
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
