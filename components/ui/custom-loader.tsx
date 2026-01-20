"use client";

import { cn } from "@/lib/utils";
import { Truck } from "lucide-react";

interface LoaderTRLProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const sizeConfig = {
  sm: {
    container: "w-12 h-12",
    icon: "w-5 h-5",
    ring: "w-12 h-12 border-2",
    text: "text-xs mt-2",
  },
  md: {
    container: "w-20 h-20",
    icon: "w-8 h-8",
    ring: "w-20 h-20 border-3",
    text: "text-sm mt-3",
  },
  lg: {
    container: "w-28 h-28",
    icon: "w-12 h-12",
    ring: "w-28 h-28 border-4",
    text: "text-base mt-4",
  },
};

export function LoaderTRL({ size = "md", className, text }: LoaderTRLProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn("relative", config.container)}>
        {/* Spinning Ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-transparent border-t-primary border-r-primary/30 animate-spin",
            config.ring,
          )}
          style={{ animationDuration: "1s" }}
        />

        {/* Secondary Ring (opposite direction) */}
        <div
          className={cn(
            "absolute inset-1 rounded-full border-transparent border-b-primary/50 border-l-primary/20 animate-spin",
            size === "sm" ? "border" : size === "md" ? "border-2" : "border-3",
          )}
          style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
        />

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Truck
              className={cn("text-primary animate-pulse", config.icon)}
              style={{ animationDuration: "2s" }}
            />
          </div>
        </div>
      </div>

      {/* Optional Text */}
      {text && (
        <p
          className={cn(
            "text-muted-foreground font-medium animate-pulse",
            config.text,
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}

// Full screen loader variant
export function FullScreenLoader({
  text = "Carregando...",
}: {
  text?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoaderTRL size="lg" text={text} />
    </div>
  );
}
