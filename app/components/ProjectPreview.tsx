'use client';

import { memo, useEffect, useMemo, useState } from 'react';

type PreviewPayload = {
  image: string | null;
  title: string | null;
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function Fallback({ url }: { url: string }) {
  const host = hostnameOf(url);
  return (
    <div className="w-full h-full bg-[#f7f7f7] flex flex-col items-center justify-center px-3 text-center">
      <p className="text-[10px] font-medium text-gray-700 truncate w-full">{host}</p>
      <p className="text-[9px] text-gray-400 mt-1">Open site</p>
    </div>
  );
}

function ProjectPreviewInner({ url }: { url: string }) {
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [imageError, setImageError] = useState(false);

  const query = useMemo(() => {
    try {
      return new URL(url).href;
    } catch {
      return url;
    }
  }, [url]);

  useEffect(() => {
    let cancelled = false;
    setPreview(null);
    setImageError(false);

    const load = async () => {
      try {
        const response = await fetch(`/api/preview?url=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('preview failed');
        const data = (await response.json()) as PreviewPayload;
        if (!cancelled) setPreview({ image: data.image ?? null, title: data.title ?? null });
      } catch {
        if (!cancelled) setPreview({ image: null, title: null });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const showImage = Boolean(preview?.image) && !imageError;

  return (
    <div
      className="absolute top-6 right-6 bottom-6 w-[162px] h-[108px] rounded-xl border border-gray-200 overflow-hidden bg-white cursor-pointer hover:border-gray-300 transition-colors"
      onClick={handlePreviewClick}
      title={preview?.title || hostnameOf(url)}
    >
      {!preview ? (
        <div className="w-full h-full bg-gray-100 animate-pulse" />
      ) : showImage ? (
        <img
          src={preview.image!}
          alt=""
          className="w-full h-full object-cover object-top"
          onError={() => setImageError(true)}
        />
      ) : (
        <Fallback url={url} />
      )}
    </div>
  );
}

export const ProjectPreview = memo(
  ProjectPreviewInner,
  (prev, next) => prev.url === next.url
);
