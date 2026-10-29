import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  caption?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  caption,
  title,
  description,
  align = "left",
  className,
}) => {
  return (
    <div
      className={cn(
        "space-y-3",
        align === "center" ? "text-center mx-auto max-w-2xl" : "max-w-xl",
        className
      )}
    >
      {caption && (
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.08em] text-primary">
          {caption}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl font-semibold text-ink-primary font-heading tracking-tight leading-snug">
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
