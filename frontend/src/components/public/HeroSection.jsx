import React from 'react';

function HeroSection() {
  return (
    <div className="relative h-96 bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden">
      {/* Background image overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop")',
        }}
      ></div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
        <h1 className="text-5xl font-bold text-white mb-4">CLAN Benin Deanery</h1>
        <p className="text-xl text-gray-100 max-w-2xl">
          Uniting parishes in faith, fostering leadership, and building a vibrant community of service and spiritual growth.
        </p>
      </div>
    </div>
  );
}

export default HeroSection;
