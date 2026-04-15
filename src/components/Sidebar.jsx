import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Microscope,
  BookOpen,
  Crosshair,
  Crown,
  User,
  Medal,
  Zap,
  ChessPiece,
} from "lucide-react";
import { cn } from "../lib/utils";

const NAV = [
  {
    group: "Command",
    items: [
      { label: "Dashboard",      path: "/",           icon: LayoutDashboard },
    ],
  },
  {
    group: "Train",
    items: [
      { label: "Game Autopsy",   path: "/autopsy",    icon: Microscope },
      { label: "Opening Lab",    path: "/openings",   icon: BookOpen },
      { label: "Middlegame Mat", path: "/middlegame", icon: Crosshair },
      { label: "Endgame Dojo",   path: "/endgame",    icon: Crown },
    ],
  },
  {
    group: "Coaches",
    items: [
      { label: "Vlad",           path: "/coach/vlad",    emoji: "🎖" },
      { label: "Magnus",         path: "/coach/magnus",  emoji: "👑" },
      { label: "Hikaru",         path: "/coach/hikaru",  emoji: "⚡" },
      { label: "Fabiano",        path: "/coach/fabiano", emoji: "♟" },
    ],
  },
  {
    group: "Profile",
    items: [
      { label: "My Profile",     path: "/profile",    icon: User },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="w-56 h-screen bg-[#090B10] border-r border-vlad-border flex flex-col flex-shrink-0">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-vlad-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-vlad-surface2 border border-vlad-border flex items-center justify-center text-xl">
            ♟
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-[0.18em] text-vlad-text leading-none">
              VLAD
            </div>
            <div className="font-mono text-[9px] text-vlad-muted tracking-[0.2em] uppercase mt-0.5">
              Chess Coach
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {NAV.map((group) => (
          <div key={group.group}>
            <div className="section-label px-2 mb-1.5">{group.group}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    cn("nav-item", isActive && "nav-item-active")
                  }
                >
                  {item.emoji ? (
                    <span className="w-5 text-center text-base leading-none">
                      {item.emoji}
                    </span>
                  ) : (
                    item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="text-[13px]">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-vlad-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-vlad-green shadow-[0_0_6px_rgba(95,168,64,0.6)]" />
          <span className="font-mono text-[10px] text-vlad-muted uppercase tracking-[0.15em]">
            AI Coaches Online
          </span>
        </div>
      </div>
    </aside>
  );
}
