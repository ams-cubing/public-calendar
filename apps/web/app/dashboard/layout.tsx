export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r p-4">
        <h2 className="text-xl font-bold mb-6 text-slate-800">
          Delegate Panel
        </h2>
        <nav className="space-y-2">
          <a href="/dashboard" className="block p-2 rounded hover:bg-slate-100">
            Overview
          </a>
          <a
            href="/dashboard/competitions"
            className="block p-2 rounded hover:bg-slate-100"
          >
            Competitions
          </a>
          <a
            href="/dashboard/availability"
            className="block p-2 rounded hover:bg-slate-100"
          >
            My Availability
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
