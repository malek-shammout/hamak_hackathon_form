import { lazy, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, usePageMeta } from "@/components/brand";
const Home = lazy(() => import("@/pages/home"));
const Register = lazy(() => import("@/pages/register"));
const AdminOverview = lazy(() => import("@/pages/admin").then((m) => ({ default: m.AdminOverview })));
const AdminRegistrations = lazy(() => import("@/pages/admin").then((m) => ({ default: m.AdminRegistrations })));
const AdminIndividuals = lazy(() => import("@/pages/admin").then((m) => ({ default: m.AdminIndividuals })));
const AdminRegistrationDetail = lazy(() => import("@/pages/admin").then((m) => ({ default: m.AdminRegistrationDetail })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function NotFoundPage() {
  usePageMeta("الصفحة غير موجودة | هاكاثون الهمك");
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background px-4">
      <div className="text-center">
        <div dir="ltr" className="font-pixel text-8xl text-primary">404</div>
        <h1 className="mt-6 text-2xl font-black">الصفحة غير موجودة</h1>
        <p className="mt-2 text-muted-foreground">ربما تغيّر الرابط أو كُتب بشكل خاطئ.</p>
        <Link to="/" className="mt-8 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground" data-testid="link-404-home">
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
}

function RouteLoading() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background" role="status" aria-label="جاري التحميل">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <RoutedErrorBoundary>
              <Suspense fallback={<RouteLoading />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/admin-hmk" element={<AdminOverview />} />
                  <Route path="/admin-hmk/registrations" element={<AdminRegistrations />} />
                  <Route path="/admin-hmk/registrations/:id" element={<AdminRegistrationDetail />} />
                  <Route path="/admin-hmk/individuals" element={<AdminIndividuals />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </RoutedErrorBoundary>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
