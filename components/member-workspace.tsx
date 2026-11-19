"use client";

import { type ReactNode } from "react";
import { Activity, LogOut, type LucideIcon } from "lucide-react";
import "@/app/portal-layout.css";

type Destination<T extends string> = { label: string; key: T; icon: LucideIcon };

type WorkspaceProps<T extends string> = {
  academy: string;
  logo?: string;
  roleLabel: string;
  active: T;
  destinations: Destination<T>[];
  onSelect: (key: T) => void;
  onLogout: () => void;
  headerAction?: ReactNode;
  children: ReactNode;
};

export default function MemberWorkspace<T extends string>({
  academy, logo, roleLabel, active, destinations, onSelect, onLogout, headerAction, children,
}: WorkspaceProps<T>) {
  return (
    <div className="member-layout">
      <header className="member-header">
        <a className="member-brand" href="/" aria-label={`Ir a la web de ${academy}`}>
          <span>{logo ? <img src={logo} alt="" /> : <Activity size={20} />}</span>
          <strong>{academy}</strong>
        </a>
        <span className="member-role">{roleLabel}</span>
        <div className="member-header-action">{headerAction}</div>
      </header>
      <nav className="member-rail" aria-label={`Navegación de ${roleLabel.toLowerCase()}`}>
        {destinations.map(({ label, key, icon: Icon }) => (
          <button key={key} aria-label={label} aria-current={active === key ? "page" : undefined}
            onClick={() => onSelect(key)}>
            <Icon size={20} /><span>{label}</span>
          </button>
        ))}
        <button className="member-rail-exit" aria-label="Cerrar sesión" onClick={onLogout}>
          <LogOut size={20} /><span>Cerrar sesión</span>
        </button>
      </nav>
      <main className="member-main">{children}</main>
    </div>
  );
}
