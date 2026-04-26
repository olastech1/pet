import { useState } from "react";

interface SafeImgProps {
  src: string | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export function SafeImg({ src, alt, className = "", loading = "lazy" }: SafeImgProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted text-muted-foreground`}>
        <span className="text-3xl select-none">🐾</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
