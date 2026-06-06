import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import SiteFooter from "./components/SiteFooter";
import ComparePage from "./pages/ComparePage";
import HomePage from "./pages/HomePage";
import ReportPage from "./pages/ReportPage";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col">
      <div className="hero-backdrop" aria-hidden />
      <div className="hero-vignette" aria-hidden />
      <Header />
      <main className="relative z-10 flex-1 flex flex-col w-full">{children}</main>
      <SiteFooter />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <HomePage />
          </Layout>
        }
      />
      <Route
        path="/report/:blobId"
        element={
          <Layout>
            <ReportPage />
          </Layout>
        }
      />
      <Route
        path="/compare/:blobId1/:blobId2"
        element={
          <Layout>
            <ComparePage />
          </Layout>
        }
      />
    </Routes>
  );
}
