"use client";

interface TranslationShimmerProps {
  lines?: number;
  className?: string;
}

export function TranslationShimmer({
  lines = 1,
  className = "",
}: TranslationShimmerProps) {
  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: "6px" }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="translation-shimmer"
          style={{
            height: "16px",
            width: i === lines - 1 && lines > 1 ? "60%" : "100%",
          }}
        />
      ))}
    </div>
  );
}
