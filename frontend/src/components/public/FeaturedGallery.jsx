import React, { useState, useEffect, useMemo, useRef } from 'react';

function FeaturedGallery({ items, loading = false, error = false, onRetry }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxItem, setLightboxItem] = useState(null);
  const lightboxTriggerRef = useRef(null);
  const closeButtonRef = useRef(null);

  const slides = useMemo(() => {
    if (!items || !items.length) return [];

    const eventChronicleCategories = ['voalc', 'seminar', 'orphanage', 'events', 'awardees'];
    const categoryGroups = items.reduce((acc, item) => {
      const category = item.category || 'uncategorized';
      acc[category] = acc[category] || [];
      acc[category].push(item);
      return acc;
    }, {});

    const eventItems = eventChronicleCategories.flatMap((category) => categoryGroups[category] || []);
    const otherItems = items.filter((item) => !eventChronicleCategories.includes(item.category) && item.category !== 'executives');
    const executiveItems = categoryGroups.executives || [];

    return [...eventItems, ...otherItems, ...executiveItems];
  }, [items]);

  const slideCount = slides.length;
  const previousIndex = slideCount > 0 ? (currentIndex - 1 + slideCount) % slideCount : 0;
  const nextIndex = slideCount > 0 ? (currentIndex + 1) % slideCount : 0;

  useEffect(() => {
    if (!slideCount) return undefined;

    const intervalId = window.setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slideCount);
      }
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, [slideCount, isPaused]);

  useEffect(() => {
    if (currentIndex >= slideCount) {
      setCurrentIndex(0);
    }
  }, [currentIndex, slideCount]);

  const handleChangeIndex = (index) => {
    setCurrentIndex(index);
  };

  const handlePrev = () => {
    handleChangeIndex(previousIndex);
  };

  const handleNext = () => {
    handleChangeIndex(nextIndex);
  };

  const openLightbox = (item, event) => {
    lightboxTriggerRef.current = event.currentTarget;
    setIsPaused(true);
    setLightboxItem(item);
  };

  const closeLightbox = () => {
    setIsPaused(false);
    setLightboxItem(null);
  };

  useEffect(() => {
    if (!lightboxItem) {
      lightboxTriggerRef.current?.focus();
      lightboxTriggerRef.current = null;
      return undefined;
    }

    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxItem]);

  if (loading) {
    return (
      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1.4fr_1fr] sm:p-6" role="status" aria-label="Loading gallery">
        <div className="min-h-64 animate-pulse rounded-2xl bg-slate-200 sm:min-h-80" />
        <div className="flex flex-col justify-center gap-4 py-2">
          <div className="h-3 w-1/3 animate-pulse rounded bg-indigo-100" />
          <div className="h-7 w-4/5 animate-pulse rounded bg-slate-200" />
          <div className="h-20 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!slides.length) {
    return (
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-black text-indigo-700" aria-hidden="true">CL</div>
        <h3 className="mt-4 text-xl font-bold text-slate-900">{error ? 'Gallery is temporarily unavailable' : 'Community moments coming soon'}</h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {error
            ? 'The gallery could not be loaded right now. Please check back later.'
            : 'Photos and highlights will appear here as new community media is shared.'}
        </p>
        {error && onRetry && (
          <button type="button" onClick={onRetry} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200">
            Retry gallery
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
      <div
        className="relative h-[31rem] overflow-hidden bg-slate-100 px-3 py-6 sm:h-[34rem] sm:px-8 sm:py-8"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {slides.map((item, index) => {
          const isCenter = index === currentIndex;
          const isLeft = index === previousIndex;
          const isRight = index === nextIndex;
          const commonClasses = 'absolute top-1/2 transition-all duration-700 ease-in-out';

          let positionClasses = 'opacity-0 scale-95 pointer-events-none';
          let widthClass = 'w-[20rem]';
          let heightClass = 'h-[20rem]';
          const visibilityClass = isCenter ? '' : 'hidden md:block';

          if (isCenter) {
            positionClasses = 'left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100 z-20 scale-100';
            widthClass = 'w-full md:w-[58%]';
            heightClass = 'h-[27rem] sm:h-[29rem]';
          } else if (isLeft) {
            positionClasses = 'left-0 top-1/2 -translate-y-1/2 -translate-x-[-15%] opacity-80 z-10 scale-90';
            widthClass = 'w-[30%] md:w-[28%]';
            heightClass = 'h-[23rem]';
          } else if (isRight) {
            positionClasses = 'right-0 top-1/2 -translate-y-1/2 translate-x-[15%] opacity-80 z-10 scale-90';
            widthClass = 'w-[30%] md:w-[28%]';
            heightClass = 'h-[23rem]';
          }

          return (
            <button
              key={`${item._id}-${index}`}
              type="button"
              onClick={isCenter ? (event) => openLightbox(item, event) : () => handleChangeIndex(index)}
              className={`${commonClasses} ${positionClasses} ${widthClass} ${heightClass} ${visibilityClass} flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/40 ${isCenter ? 'cursor-zoom-in' : 'cursor-pointer hover:opacity-100'}`}
              aria-label={isCenter ? 'Open image lightbox' : `Move carousel to ${item.title || item.category}`}
            >
              <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-100">
                <img
                  src={item.url}
                  alt={item.title || item.caption || item.category}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white sm:left-4 sm:top-4">
                  {item.category || 'Community'}
                </div>
              </div>
              <div className="shrink-0 p-4 text-left">
                {item.title && <h3 className="truncate text-lg font-semibold text-slate-900">{item.title}</h3>}
                <p className="mt-2 max-h-20 overflow-hidden text-sm leading-6 text-slate-600">
                  {item.caption || 'Premium community highlight.'}
                </p>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-xl text-slate-800 shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 sm:left-4 sm:p-3"
          aria-label="Previous gallery image"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-xl text-slate-800 shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 sm:right-4 sm:p-3"
          aria-label="Next gallery image"
        >
          ›
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 py-4 sm:py-5" aria-label="Gallery slides">
        {slides.map((_, index) => (
          <button
            key={`dot-${index}`}
            type="button"
            onClick={() => handleChangeIndex(index)}
            className={`h-3 w-3 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${index === currentIndex ? 'bg-slate-900 w-6' : 'bg-slate-300 hover:bg-slate-400'}`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentIndex ? 'true' : undefined}
          />
        ))}
      </div>

      {lightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title || 'Gallery image'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
          onClick={closeLightbox}
        >
          <div className="relative mx-auto max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              ref={closeButtonRef}
              className="absolute right-4 top-4 z-40 rounded-full bg-black/80 px-3 py-2 text-white hover:bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
              onClick={closeLightbox}
              aria-label="Close lightbox"
            >
              X
            </button>
            <div className="flex min-h-[70vh] flex-col bg-slate-100 p-4 sm:p-6">
              <div className="min-h-[40vh] flex-1 overflow-hidden rounded-2xl bg-black sm:min-h-[50vh]">
                <img
                  src={lightboxItem.url}
                  alt={lightboxItem.title || lightboxItem.caption || lightboxItem.category}
                  className="h-full w-full object-contain bg-transparent"
                />
              </div>
              <div className="mt-6 text-left">
                {lightboxItem.title && <h3 className="text-3xl font-bold text-slate-900">{lightboxItem.title}</h3>}
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                  {lightboxItem.caption ? (
                    lightboxItem.caption.split(/\n+/).map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))
                  ) : (
                    <p>No description available for this gallery item.</p>
                  )}
                </div>
                <p className="mt-5 text-xs uppercase tracking-[0.32em] text-slate-500">
                  Category: {lightboxItem.category || 'General'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeaturedGallery;
