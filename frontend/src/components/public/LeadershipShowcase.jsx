import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LeadershipShowcase() {
  const [leadership, setLeadership] = useState({ executives: [], patrons: [], featuredExecutives: [] });
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllExecutives, setShowAllExecutives] = useState(false);

  useEffect(() => {
    const apiRoot = import.meta.env.VITE_API_URL || '';

    const fetchLeadership = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiRoot}/api/public/leadership`);
        setLeadership(response.data.data || { executives: [], patrons: [], featuredExecutives: [] });
        setError(null);
      } catch (err) {
        console.error('Error fetching leadership profiles:', err);
        setError('Unable to load leadership profiles');
        setLeadership({ executives: [], patrons: [], featuredExecutives: [] });
      } finally {
        setLoading(false);
      }
    };

    const fetchExecutiveGallery = async () => {
      try {
        const response = await axios.get(`${apiRoot}/api/public/gallery?category=executives`);
        if (response.data?.success) {
          setGalleryItems(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching executives gallery items:', err);
      }
    };

    fetchLeadership();
    fetchExecutiveGallery();
  }, []);

  const allExecutives = leadership.executives || [];
  const visibleExecutives = showAllExecutives ? allExecutives : allExecutives.slice(0, 6);
  const canExpandExecutives = allExecutives.length > 6;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error && galleryItems.length === 0) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  const LeadershipCard = ({ member }) => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300">
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {member.profileImage ? (
          <img
            src={member.profileImage}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
            <span className="text-4xl text-white">
              {member.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800">{member.name}</h3>
        <p className="text-sm text-blue-700 font-semibold mb-2">{member.position}</p>
        {member.profileTitle && (
          <p className="text-sm text-gray-600 mb-3">{member.profileTitle}</p>
        )}
        {member.email && (
          <a href={`mailto:${member.email}`} className="text-sm text-blue-600 hover:underline">
            Contact
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      {allExecutives.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Leadership Team</h3>
            {canExpandExecutives && (
              <button
                type="button"
                onClick={() => setShowAllExecutives((current) => !current)}
                className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                {showAllExecutives ? 'View less' : 'View more'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleExecutives.map((member) => (
              <LeadershipCard key={member._id} member={member} />
            ))}
          </div>
        </div>
      )}

      {leadership.patrons.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Patron & Patroness</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            {leadership.patrons.map((member) => (
              <LeadershipCard key={member._id} member={member} />
            ))}
          </div>
        </div>
      )}

      {allExecutives.length === 0 && leadership.patrons.length === 0 && galleryItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Leadership profiles coming soon</p>
        </div>
      )}

      {galleryItems.length > 0 && allExecutives.length === 0 && leadership.patrons.length === 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Executive Gallery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-56 bg-gray-200 overflow-hidden">
                  <img src={item.url || item.imageUrl || item.fileUrl} alt={item.title || 'Executive image'} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">{item.title || 'Executive feature'}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.caption || 'Executive gallery item'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadershipShowcase;
