import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InfosSidebar from "@/components/InfosSidebar";

export default function InfosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate min-h-screen flex flex-col font-mono text-left bg-[#13141c] text-[#a9b1d6] overflow-x-hidden">
      <div className="app-noise absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        {/* Row: sidebar + content, starts below fixed header */}
        <div className="flex flex-1 pt-[72px]">

          {/* Sidebar — sticky within the scrolling page */}
          <div className="hidden lg:block w-[220px] shrink-0">
            <div className="sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto pt-10 px-6">
              <InfosSidebar />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-[#2a2d3e] shrink-0" />

          {/* Main content — centered within remaining space */}
          <div className="flex-1 min-w-0 flex flex-col items-center px-6 lg:px-10">
            <div className="w-full max-w-3xl">
              {children}
            </div>
          </div>

        </div>

        <Footer />
      </div>
    </div>
  );
}
