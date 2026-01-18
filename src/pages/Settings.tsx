import { useState } from 'react';
import {
    User,
    Bell,
    Database,
    Download,
    Trash2,
    Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLabel } from '@/lib/auth';

export default function Settings() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });

    const [notifications, setNotifications] = useState({
        lowStock: true,
        newDocuments: true,
        anomalies: true,
        emailDigest: false,
    });

    const handleSaveProfile = () => {
        toast({
            title: 'Profil gespeichert',
            description: 'Ihre Änderungen wurden erfolgreich gespeichert.',
        });
    };

    const handleExportData = () => {
        const data = {
            exportDate: new Date().toISOString(),
            user: user,
            note: 'Demo-Export - In Produktion würde hier der vollständige Datenexport erfolgen.',
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gastrowws -export -${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: 'Daten exportiert',
            description: 'Der Datenexport wurde gestartet.',
        });
    };

    const handleClearData = () => {
        localStorage.clear();
        toast({
            title: 'Daten gelöscht',
            description: 'Alle lokalen Daten wurden gelöscht. Die Seite wird neu geladen.',
        });
        setTimeout(() => window.location.reload(), 1500);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Einstellungen</h1>
                <p className="text-slate-500 mt-1">Konto und Systemeinstellungen verwalten</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile">
                        <User className="h-4 w-4 mr-2" />
                        Profil
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        <Bell className="h-4 w-4 mr-2" />
                        Benachrichtigungen
                    </TabsTrigger>
                    <TabsTrigger value="data">
                        <Database className="h-4 w-4 mr-2" />
                        Daten
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profil-Einstellungen</CardTitle>
                            <CardDescription>
                                Verwalten Sie Ihre persönlichen Informationen
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">E-Mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-medium">Aktuelle Rolle</p>
                                    <p className="text-sm text-slate-500">
                                        {user ? getRoleLabel(user.role) : '-'}
                                    </p>
                                </div>
                                <p className="text-sm text-slate-400">
                                    Rollen können nur von Administratoren geändert werden
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleSaveProfile} className="bg-amber-500 hover:bg-amber-600">
                                    <Save className="h-4 w-4 mr-2" />
                                    Änderungen speichern
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Benachrichtigungen</CardTitle>
                            <CardDescription>
                                Konfigurieren Sie, welche Benachrichtigungen Sie erhalten möchten
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Niedriger Bestand</p>
                                        <p className="text-sm text-slate-500">
                                            Benachrichtigung bei Produkten unter Mindestbestand
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notifications.lowStock}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, lowStock: checked })
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Neue Dokumente</p>
                                        <p className="text-sm text-slate-500">
                                            Benachrichtigung bei neuen Rechnungen oder Lieferscheinen
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notifications.newDocuments}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, newDocuments: checked })
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Auffälligkeiten</p>
                                        <p className="text-sm text-slate-500">
                                            Benachrichtigung bei erkannten Anomalien
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notifications.anomalies}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, anomalies: checked })
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Tägliche E-Mail-Zusammenfassung</p>
                                        <p className="text-sm text-slate-500">
                                            Erhalten Sie eine tägliche Übersicht per E-Mail
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notifications.emailDigest}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, emailDigest: checked })
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Data Tab */}
                <TabsContent value="data">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Daten exportieren</CardTitle>
                                <CardDescription>
                                    Laden Sie eine Kopie Ihrer Daten herunter
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={handleExportData} variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Daten als JSON exportieren
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-red-200">
                            <CardHeader>
                                <CardTitle className="text-red-600">Gefahrenzone</CardTitle>
                                <CardDescription>
                                    Vorsicht: Diese Aktionen können nicht rückgängig gemacht werden
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Alle lokalen Daten löschen
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Diese Aktion löscht alle lokalen Daten unwiderruflich.
                                                Sie werden ausgeloggt und die Demo-Daten werden neu geladen.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleClearData}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Ja, alle Daten löschen
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>

                        {/* System Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>System-Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 text-sm">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-slate-500">Version</span>
                                        <span className="font-medium">1.0.0 (Demo)</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-slate-500">Speicherung</span>
                                        <span className="font-medium">LocalStorage (Browser)</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-slate-500">Framework</span>
                                        <span className="font-medium">React + Vite + TypeScript</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
