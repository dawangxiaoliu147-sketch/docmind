import { Navbar } from "@/components/navbar";
import { FloatingAgent } from "@/components/floating-agent";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      <FloatingAgent />
    </div>
  );
}
