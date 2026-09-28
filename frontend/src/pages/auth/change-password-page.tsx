import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/layout/logo";
import { useAuthStore } from "@/stores/auth-store";
import { changePasswordRequest } from "@/lib/auth-api";
import { getErrorMessage } from "@/lib/api";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const setPasswordChanged = useAuthStore((s) => s.setPasswordChanged);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setPending(true);
    try {
      await changePasswordRequest(values.currentPassword, values.newPassword);
      setPasswordChanged();
      toast.success("Password updated");
      navigate("/home", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-[26rem] gap-0 border border-border bg-card py-0 shadow-lg shadow-foreground/5 ring-0">
        <CardHeader className="justify-items-center gap-2 px-6 pb-5 pt-7 text-center">
          <Logo height={22} />
          <h1 className="text-2xl font-semibold">Set your password</h1>
          <CardDescription>Your account was just created with a temporary password — set your own before continuing.</CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-2">Current (temporary) password</label>
              <Input type="password" autoComplete="current-password" {...register("currentPassword")} />
              {errors.currentPassword && <span className="text-xs text-destructive">{errors.currentPassword.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-2">New password</label>
              <Input type="password" autoComplete="new-password" {...register("newPassword")} />
              {errors.newPassword && <span className="text-xs text-destructive">{errors.newPassword.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-2">Confirm new password</label>
              <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
              {errors.confirmPassword && <span className="text-xs text-destructive">{errors.confirmPassword.message}</span>}
            </div>
            <Button type="submit" disabled={pending} className="mt-1.5 w-full shadow-[var(--shadow-brand)]">
              {pending ? "Saving…" : "Set password and continue"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="mt-7 justify-center rounded-b-xl border-t border-border bg-[var(--surface-sunk)] px-6 py-4 text-sm text-muted-foreground">
          nFolks ATLAS · Learning Services
        </CardFooter>
      </Card>
    </main>
  );
}
