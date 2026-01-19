"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users as UsersIcon,
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getRoleLabel, type UserRole } from "@/types";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type User = {
  _id: Id<"users">;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: number;
};

export default function UsersPage() {
  const users = useQuery(api.users.list) ?? [];
  const updateUser = useMutation(api.users.update);
  const createUser = useMutation(api.users.create);
  const deleteUserMutation = useMutation(api.users.remove);
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== "admin") {
      router.push("/");
    }
  }, [currentUser, authLoading, router]);

  const filteredUsers = users.filter(
    (user: User) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="h-4 w-4 text-red-500" />;
      case "manager":
        return <Shield className="h-4 w-4 text-amber-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-slate-400" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    if (editUser) {
      await updateUser({
        id: editUser._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      });
      setEditUser(null);
      toast({
        title: "Benutzer aktualisiert",
        description: `${userData.name} wurde erfolgreich gespeichert.`,
      });
    }
  };

  const handleAddUser = async (userData: Partial<User>) => {
    if (!userData.name || !userData.email || !userData.role) {
      return;
    }
    await createUser({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      passwordHash: "password123", // Default password
    });
    setIsAddDialogOpen(false);
    toast({
      title: "Benutzer hinzugefügt",
      description: `${userData.name} wurde erfolgreich angelegt.`,
    });
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    await deleteUserMutation({ id: deleteUser._id });
    toast({
      title: "Benutzer gelöscht",
      description: `${deleteUser.name} wurde entfernt.`,
      variant: "destructive",
    });
    setDeleteUser(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("de-DE");
  };

  if (!users || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (currentUser?.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Benutzer</h1>
          <p className="text-slate-500 mt-1">Benutzerkonten verwalten</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Benutzer hinzufügen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Benutzer gesamt</p>
                <p className="text-2xl font-bold text-slate-900">
                  {users.length}
                </p>
              </div>
              <UsersIcon className="h-8 w-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-slate-500">Administratoren</p>
              <p className="text-2xl font-bold text-red-600">
                {users.filter((u: User) => u.role === "admin").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-slate-500">Manager</p>
              <p className="text-2xl font-bold text-amber-600">
                {users.filter((u: User) => u.role === "manager").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Benutzer suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Benutzer</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Erstellt am</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user: User) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                    {user._id === currentUser?._id && (
                      <Badge variant="outline" className="text-xs">
                        Du
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteUser(user)}
                      disabled={user._id === currentUser?._id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-slate-500"
                >
                  Keine Benutzer gefunden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit User Dialog */}
      <UserDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        onSave={handleSaveUser}
      />

      {/* Add User Dialog */}
      <UserDialog
        user={null}
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleAddUser}
        isNew
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Benutzer <strong>{deleteUser?.name}</strong>{" "}
              wirklich löschen? Diese Aktion kann nicht rückgängig gemacht
              werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface UserDialogProps {
  user: User | null;
  isOpen?: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => void;
  isNew?: boolean;
}

function UserDialog({ user, isOpen, onClose, onSave, isNew }: UserDialogProps) {
  const [formData, setFormData] = useState<Partial<User>>(
    user || {
      name: "",
      email: "",
      role: "staff",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Update form when user changes
  if (user && formData._id !== user._id) {
    setFormData(user);
  }

  const open = isOpen !== undefined ? isOpen : !!user;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Neuer Benutzer" : "Benutzer bearbeiten"}
          </DialogTitle>
          <DialogDescription>
            {isNew
              ? "Neues Benutzerkonto anlegen"
              : "Benutzerdaten aktualisieren"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Rolle</Label>
              <Select
                value={formData.role}
                onValueChange={(v) =>
                  setFormData({ ...formData, role: v as UserRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Mitarbeiter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600">
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
