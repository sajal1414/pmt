import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/layout/logo";
import { useAuthStore } from "@/stores/auth-store";
import { loginRequest } from "@/lib/auth-api";
import { getErrorMessage } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setPending(true);
    try {
      const res = await loginRequest(values.email, values.password);
      setSession(
        {
          id: res.id,
          email: values.email,
          role: res.role,
          fullName: res.full_name,
          instructorId: res.instructor_id,
          mustChangePassword: res.must_change_password,
        },
        res.token,
      );
      navigate(res.must_change_password ? "/change-password" : "/home", { replace: true });
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
          <h1 className="text-2xl font-semibold">Sign in to your account</h1>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-fg-2">
                Email
              </label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-fg-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
            </div>

            <Button type="submit" disabled={pending} className="mt-1.5 w-full shadow-[var(--shadow-brand)]">
              {pending ? "Signing in…" : "Sign in"}
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
