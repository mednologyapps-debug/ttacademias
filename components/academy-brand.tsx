"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export default function AcademyBrand({ className = "brand", iconSize = 20 }: { className?: string; iconSize?: number }) {
  const [brand, setBrand] = useState<{ name: string; logoUrl: string } | null>(null);
  useEffect(() => { fetch("/api/public/academy").then((response) => response.json()).then((data) => { if (data.academy?.name) setBrand({ name: data.academy.name, logoUrl: data.academy.logoUrl || "" }); }).catch(() => undefined); }, []);
  return <><span className="brand-mark">{brand?.logoUrl ? <img src={brand.logoUrl} alt=""/> : <Activity size={iconSize} strokeWidth={2.5}/>}</span><span>{brand?.name || "TT Academias"}</span></>;
}
