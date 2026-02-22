"use client";
import { FileText } from "lucide-react";
import { useUITranslation } from "@/hooks/useUITranslation";

export function DocsPageTitle() {
  const { t } = useUITranslation();
  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)" }}>{t("doc.documents")}</h1>
      <p>{t("doc.subtitle")}</p>
    </div>
  );
}

export function DocsEmptyState() {
  const { t } = useUITranslation();
  return (
    <div
      style={{
        gridColumn: "1/-1",
        textAlign: "center",
        padding: "64px 0",
        color: "var(--color-text-2)",
      }}
    >
      <FileText size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
      <p>{t("doc.empty")}</p>
    </div>
  );
}
