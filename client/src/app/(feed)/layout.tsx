import React from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import RightPanel from "@/components/layout/RightPanel";

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col bg-fb-bg  text-fb-text-dark  pt-[56px]">
      <Navbar />
      <div className="flex w-full justify-center">
        <Sidebar />
        <main className="flex-1 w-full max-w-[680px] mt-4 xl:ml-[300px] lg:mr-[300px] px-4">
          {children}
        </main>
        <RightPanel />
      </div>
    </div>
  );
}
