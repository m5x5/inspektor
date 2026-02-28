import { Suspense } from "react";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { HomePageProvider } from "@/contexts/HomePageContext";
import { HomeClientContent } from "@/components/HomeClientContent";

type PageProps = {
  searchParams: Promise<{ path?: string }>;
};

function HomePageInner() {
  return (
    <HomePageProvider>
      <HomeClientContent />
    </HomePageProvider>
  );
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pathParam = params?.path ?? "/";
  const currentDirPath = pathParam.endsWith("/") ? pathParam : pathParam + "/";

  return (
    <>
      {/* Always rendered — outside any Suspense or client provider */}
      <header className="flex h-14 shrink-0 w-full items-center gap-4 px-4 md:grid md:grid-cols-[1.618fr_3rem_1fr] md:px-0 md:pb-3 border-b">
        <BreadcrumbNav currentDirPath={currentDirPath} />
        {/* Slot for HomeHeaderActions — rendered here via portal from HomeClientContent */}
        <div id="home-header-actions-slot" className="contents" />
      </header>
      <Suspense fallback={null}>
        <HomePageInner />
      </Suspense>
    </>
  );
}
