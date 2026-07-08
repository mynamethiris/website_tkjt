import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  referrerPolicy?: "no-referrer" | "no-referrer-when-downgrade" | "origin" | "origin-when-cross-origin" | "same-origin" | "strict-origin" | "strict-origin-when-cross-origin" | "unsafe-url" | any;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '120px' }
    );

    observer.observe(containerRef.current);
    return () => { observer.disconnect(); };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-950/40 ${containerClassName}`}
    >
      {shouldLoad && !hasError && (
         <img
          src={src}
          alt={alt}
          className={`transition-all duration-300 ease-out ${
            isLoaded
              ? 'opacity-100 scale-100 blur-0'
              : 'opacity-0 scale-98 blur-[3px]'
          } ${className}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          {...props}
        />
      )}

      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900/40 animate-pulse flex items-center justify-center">
          <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-550 dark:border-t-blue-400 animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
          <ImageOff className="h-8 w-8" />
          <span className="text-[10px] font-medium">Gagal memuat gambar</span>
        </div>
      )}
    </div>
  );
}
