import React, { useState, useEffect, useMemo } from 'react';

function FeaturedGallery({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxItem, setLightboxItem] = useState(null);

  const slides = useMemo(() => {
    if (!items || !items.length) return [];

    const eventChronicleCategories = ['seminar', 'orphanage', 'voalc', 'events', 'awardees'];
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

  useEffect(() => {
    if (!slideCount) return undefined;

    const interval = window.setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slideCount);
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [slideCount, isPaused]);

  useEffect(() => {
    if (currentIndex >= slideCount) {
      setCurrentIndex(0);
    }
  }, [currentIndex, slideCount]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slideCount) % slideCount);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slideCount);
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
        className="relative h-[28rem] bg-slate-100"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {slides.map((item, index) => (
          <div
            key={`${item._id}-${index}`}
            className={`absolute inset-0 flex flex-col items-center justify-center px-4 py-6 transition-all duration-700 ease-out ${index === currentIndex ? 'opacity-100 translate-x-0 z-20' : 'opacity-0 translate-x-4 z-10'}`}
            style={{ transitionProperty: 'opacity, transform' }}
          >
            <button
              type="button"
              className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/30 p-3 text-white hover:bg-black/50 focus:outline-none"
              onClick={handlePrev}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/30 p-3 text-white hover:bg-black/50 focus:outline-none"
              onClick={handleNext}
              aria-label="Next slide"
            >
              ›
            </button>
            <div
              className="relative flex h-full w-full max-w-6xl items-center justify-center overflow-hidden rounded-[2rem] bg-slate-100 shadow-lg"
              onClick={() => openLightbox(item)}
            >
              <img
                src={item.url}
                alt={item.title || item.caption || item.category}
                className="h-full w-full object-contain bg-transparent"
                loading="lazy"
              />
            </div>
            <div className="mt-6 w-full max-w-6xl text-center">
              {item.title && <h3 className="text-2xl font-semibold text-gray-900">{item.title}</h3>}
              <p className="mt-3 text-sm leading-7 text-gray-600">
                {item.caption || 'Click the image to view it full screen with title and details.'}
              </p>
            </div>
          </div>
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
