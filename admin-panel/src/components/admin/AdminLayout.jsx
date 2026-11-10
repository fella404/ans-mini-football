import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { formatTanggalPendek, wibToday } from "../../lib/format";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/pesanan", label: "Pesanan", icon: ClipboardList },
  { to: "/jadwal", label: "Jadwal", icon: CalendarDays },
  { to: "/lapangan", label: "Lapangan", icon: MapPin, adminOnly: true },
  { to: "/staff", label: "Staff", icon: Users, adminOnly: true },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings },
];

const TITLES = Object.fromEntries(NAV.map((item) => [item.to, item.label]));

const linkClass = ({ isActive }) =>
  [
    "flex items-center gap-2.5 border-l-2 px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-150",
    isActive
      ? "border-primary bg-muted text-foreground"
      : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  ].join(" ");

const AdminLayout = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const items = NAV.filter((item) => !item.adminOnly || user?.role === "admin");
  const title = TITLES[pathname] ?? "Admin";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const userBlock = (
    <>
      <div className="flex items-center gap-1.5">
        <p className="min-w-0 truncate text-[13px] font-semibold text-foreground">
          {user?.name}
        </p>
        <span aria-hidden="true" className="shrink-0 text-muted-foreground">
          -
        </span>
        <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {user?.role === "admin" ? "Admin" : "Staff"}
        </span>
      </div>
      <p className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {user?.email}
      </p>
    </>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-60 flex-col border-r border-sidebar-border bg-sidebar transition-[transform,visibility] duration-200 lg:sticky lg:top-0 lg:bottom-auto lg:z-auto lg:w-auto lg:translate-x-0 ${
          open ? "visible translate-x-0" : "invisible -translate-x-full lg:visible"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <img
            src="/admin/logo-ans.png"
            alt="ANS Mini Football"
            className="h-9 w-9 object-contain"
          />
          <div className="min-w-0">
            <p className="font-heading text-sm font-bold uppercase leading-none tracking-[0.12em] text-foreground">
              ANS
            </p>
            <p className="mt-1 text-[10px] uppercase leading-none tracking-[0.18em] text-muted-foreground">
              Mini Football
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="ml-auto flex size-8 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <nav
          aria-label="Navigasi admin"
          className="flex-1 space-y-0.5 overflow-y-auto py-3"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          {userBlock}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex h-8 w-full items-center justify-center gap-2 border border-border text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          >
            <LogOut aria-hidden="true" className="size-3.5" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Buka menu"
                aria-expanded={open}
                aria-controls="admin-sidebar"
                className="flex size-8 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground lg:hidden"
              >
                <Menu aria-hidden="true" className="size-4" />
              </button>
              <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                {title}
              </p>
            </div>

            <span className="hidden border border-border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:inline">
              {formatTanggalPendek(wibToday())}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[90rem] flex-1 p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
