import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/shared/layout/app-layout";
import { ProtectedRoute } from "@/components/shared/auth/protected-route";
import { AdminRoute } from "@/components/shared/auth/admin-route";
import { ErrorBoundary, RouteErrorElement } from "@/components/shared/error-boundary";
import { createQueryClient } from "@/lib/query-client";

import LoginPage from "@/pages/auth/login-page";
import ChangePasswordPage from "@/pages/auth/change-password-page";
import HomePage from "@/pages/home/home-page";
import CoursesPage from "@/pages/courses/courses-page";
import CourseDetailPage from "@/pages/courses/course-detail-page";
import InstructorsPage from "@/pages/instructors/instructors-page";
import DeliveriesPage from "@/pages/deliveries/deliveries-page";
import UsersPage from "@/pages/users/users-page";
import NotFoundPage from "@/pages/not-found-page";

const queryClient = createQueryClient();

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
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
