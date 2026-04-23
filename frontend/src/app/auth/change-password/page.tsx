"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";

export default function ChangePasswordPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const tokens = useAuthStore((state) => state.tokens);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Utilisateur non connecté");
      if (password !== confirmPassword) throw new Error("Les mots de passe ne correspondent pas");
      if (password.length < 4) throw new Error("Le mot de passe doit contenir au moins 4 caractères");

      const { data } = await apiClient.patch(`/utilisateurs/${user.id}/`, {
        password: password,
      });
      return data;
    },
    onSuccess: (updatedUser) => {
      toast.success("Mot de passe mis à jour avec succès");
      if (tokens) {
        setAuth({ tokens, user: updatedUser });
      }
      router.push("/");
    },
    onError: (error: any) => {
      toast.error(error?.message || error?.response?.data?.detail || "Impossible de modifier le mot de passe");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Nouveau mot de passe</CardTitle>
          <CardDescription className="text-center">
            Pour sécuriser votre compte, veuillez définir un nouveau mot de passe pour votre première connexion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input 
                id="confirm"
                type="password" 
                placeholder="••••••••" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full mt-4" 
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Mettre à jour et accéder au tableau de bord"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
