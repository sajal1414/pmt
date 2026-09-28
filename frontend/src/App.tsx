import { lazy, Suspense } from "react";
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/shared/layout/app-layout";
import { ProtectedRoute } from "@/components/shared/auth/protected-route";
import { AdminRoute } from "@/components/shared/auth/admin-route";
import { ErrorBoundary, RouteErrorElement } from "@/components/shared/error-boundary";
import { createQueryClient } from "@/lib/query-client";

const queryClient = createQueryClient();

const LoginPage = lazy(() => import("@/pages/auth/login-page"));
const ChangePasswordPage = lazy(() => import("@/pages/auth/change-password-page"));
const HomePage = lazy(() => import("@/pages/home/home-page"));
const CoursesPage = lazy(() => import("@/pages/courses/courses-page"));
const CourseDetailPage = lazy(() => import("@/pages/courses/course-detail-page"));
const InstructorsPage = lazy(() => import("@/pages/instructors/instructors-page"));
const DeliveriesPage = lazy(() => import("@/pages/deliveries/deliveries-page"));
const UsersPage = lazy(() => import("@/pages/users/users-page"));
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));

function Loading() {
  return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<RouteErrorElement />}>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/instructors" element={<InstructorsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Route>,
  ),
);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Suspense fallback={<Loading />}>
            <RouterProvider router={router} />
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
