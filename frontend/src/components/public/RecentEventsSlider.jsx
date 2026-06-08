import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RecentEventsSlider() {
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/public/recent-events?limit=4`);
        setEvents(response.data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching recent events:', err);
        // Not a critical error - show placeholder
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Auto-advance carousel every 5 seconds if events exist
  useEffect(() => {
    if (events.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [events.length]);

  const goToPrevious = () => {
    if (events.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + events.length) % events.length);
    }
  };

  const goToNext = () => {
    if (events.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  // Placeholder content when no events exist yet
  if (events.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-96 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600 text-lg">Event photos coming soon</p>
              <p className="text-gray-500 text-sm mt-2">Check back as we upload recent community moments</p>
            </div>
          </div>
        </div>

        {/* Events Grid - Show sample placeholders */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Event {i}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Carousel view when events exist
  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative bg-white rounded-lg shadow-lg overflow-hidden group">
        {/* Main Carousel */}
        <div className="relative h-96 bg-gray-100">
          {events[currentIndex] && (
            <img
              src={events[currentIndex].url}
              alt={events[currentIndex].title || 'Event'}
              className="w-full h-full object-cover"
            />
          )}

          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 transition z-10"
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 transition z-10"
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Event Title Overlay */}
          {events[currentIndex]?.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 text-white">
              <h3 className="text-2xl font-bold">{events[currentIndex].title}</h3>
              <p className="text-sm text-gray-200 mt-2">{events[currentIndex].date}</p>
            </div>
          )}

          {/* Slide Counter */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {events.length}
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 p-4 bg-gray-50 overflow-x-auto">
          {events.map((event, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 h-20 w-20 rounded overflow-hidden border-2 transition ${
                index === currentIndex ? 'border-blue-600' : 'border-gray-300'
              }`}
            >
              <img
                src={event.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RecentEventsSlider;
