"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Two halves of the same job: find the competitions, then keep track of the
// ones you went for. A tab rather than a new item in the top menu, which is
// long enough already.

const FANER = [
  { href: "/app/anbud", label: "Søk konkurranser" },
  { href: "/app/anbud/mine", label: "Mine bud" },
];

export default function AnbudLayout({ children }: { children: React.ReactNode }) {
  const sti = usePathname();

  return (
    <div>
      <div className="pillgroup" style={{ marginBottom: 18 }}>
        {FANER.map((f) => (
          <Link key={f.href} href={f.href} data-active={sti === f.href}>
            {f.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
