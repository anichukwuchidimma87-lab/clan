import React, { useState, useEffect, useMemo } from 'react';

function FeaturedGallery({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxItem, setLightboxItem] = useState(null);

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

  const openLightbox = (item) => {
    setIsPaused(true);
    setLightboxItem(item);
  };

  const closeLightbox = () => {
    setIsPaused(false);
    setLightboxItem(null);
  };

  if (!slides.length) {
    return (
      <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="text-4xl mb-4">📷</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Dynamic Gallery Coming Soon</h3>
        <p className="text-sm text-gray-500">
          As your team adds media through the admin CMS, this section will refresh automatically with a new mix of event, award, and leadership images.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
      <div
        className="relative h-[33rem] overflow-hidden bg-slate-100 px-4 py-8 md:px-8"
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
          const visibilityClass = isCenter ? '' : 'hidden md:block';

          if (isCenter) {
            positionClasses = 'left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100 z-20 scale-100';
            widthClass = 'w-full md:w-[58%]';
          } else if (isLeft) {
            positionClasses = 'left-0 top-1/2 -translate-y-1/2 -translate-x-[-15%] opacity-80 z-10 scale-90';
            widthClass = 'w-[30%] md:w-[28%]';
          } else if (isRight) {
            positionClasses = 'right-0 top-1/2 -translate-y-1/2 translate-x-[15%] opacity-80 z-10 scale-90';
            widthClass = 'w-[30%] md:w-[28%]';
          }

          return (
            <button
              key={`${item._id}-${index}`}
              type="button"
              onClick={isCenter ? () => openLightbox(item) : () => handleChangeIndex(index)}
              className={`${commonClasses} ${positionClasses} ${widthClass} ${visibilityClass} rounded-[2rem] border border-slate-200 bg-white shadow-xl focus:outline-none ${isCenter ? 'cursor-zoom-in' : 'cursor-pointer hover:opacity-100'} overflow-hidden`}
              aria-label={isCenter ? 'Open image lightbox' : `Move carousel to ${item.title || item.category}`}
            >
              <div className="relative h-full overflow-hidden rounded-[2rem] bg-slate-100">
                <img
                  src={item.url}
                  alt={item.title || item.caption || item.category}
                  className="h-full w-full object-contain bg-transparent"
                  loading="lazy"
                />
                <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white">
                  {item.category}
                </div>
              </div>
              <div className="p-4 text-left">
                {item.title && <h3 className="truncate text-lg font-semibold text-slate-900">{item.title}</h3>}
                <p className="mt-2 text-sm leading-6 text-slate-600 max-h-20 overflow-hidden">
                  {item.caption || 'Premium community highlight.'}
                </p>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-3 text-xl text-slate-800 shadow-md transition hover:bg-white"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-3 text-xl text-slate-800 shadow-md transition hover:bg-white"
          aria-label="Next"
        >
          ›
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 py-5">
        {slides.map((_, index) => (
          <button
            key={`dot-${index}`}
            type="button"
            onClick={() => handleChangeIndex(index)}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-slate-900 w-6' : 'bg-slate-300 hover:bg-slate-400'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={closeLightbox}
        >
          <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="absolute right-4 top-4 z-40 rounded-full bg-black/80 px-3 py-2 text-white hover:bg-black"
              onClick={closeLightbox}
              aria-label="Close lightbox"
            >
              X
            </button>
            <div className="flex min-h-[60vh] flex-col bg-slate-100 p-6">
              <div className="flex-1 overflow-hidden rounded-3xl bg-black">
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
