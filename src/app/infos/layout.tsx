import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InfosSidebar from "@/components/InfosSidebar";
import InfosContentWrapper from "@/components/InfosContentWrapper";

export default function InfosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate min-h-screen flex flex-col font-mono text-left bg-[#13141c] text-[#a9b1d6] overflow-x-clip">
      <div className="app-noise absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        {/* Row: sidebar + content, starts below fixed header */}
        <div className="flex flex-1 pt-[72px] items-start">

          {/* Sidebar — sticky within the scrolling page.
              `self-start` prevents flex from stretching it to row height,
              which would leave no room for sticky to slide. */}
          <aside className="hidden lg:block w-[220px] shrink-0 self-start sticky top-[72px] max-h-[calc(100vh-72px)] overflow-y-auto pt-10 px-6">
            <InfosSidebar />
          </aside>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-[#2a2d3e] shrink-0 self-stretch" />

          {/* Main content — background shifts on article pages */}
          <InfosContentWrapper>
            {children}
          </InfosContentWrapper>

        </div>

        <Footer />
      </div>
    </div>
  );
}
