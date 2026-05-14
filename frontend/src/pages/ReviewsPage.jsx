import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { auth } from '../config/firebase';

export default function ReviewsPage() {
  const navigate = useNavigate();
  const { userID, assetID } = useParams();
  const [userData, setUserData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    fetchReviews();
  }, [userID, assetID]);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch user data if userID provided
      if (userID) {
        const userRes = await API.get(`/profile/${userID}`);
        setUserData(userRes.data?.data || userRes.data);
      }

      // Fetch reviews - either for user or asset
      let reviewsRes;
      if (userID) {
        reviewsRes = await API.get(`/reviews/user/${userID}`);
      } else if (assetID) {
        reviewsRes = await API.get(`/reviews/asset/${assetID}`);
      } else {
        reviewsRes = await API.get(`/reviews`);
      }
      
      const allReviews = reviewsRes.data?.data || reviewsRes.data || [];
      setReviews(allReviews);

      // Calculate stats
      if (allReviews.length > 0) {
        const avgRating = (allReviews.reduce((sum, r) => sum + (r.Rating || 0), 0) / allReviews.length).toFixed(1);
        const ratingDistribution = {
          5: allReviews.filter(r => r.Rating === 5).length,
          4: allReviews.filter(r => r.Rating === 4).length,
          3: allReviews.filter(r => r.Rating === 3).length,
          2: allReviews.filter(r => r.Rating === 2).length,
          1: allReviews.filter(r => r.Rating === 1).length,
        };
        setStats({ avgRating, totalReviews: allReviews.length, distribution: ratingDistribution });
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError(err.response?.data?.error || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            style={{
              fontSize: '1rem',
              color: star <= rating ? C.saffronDark : '#d1d5db',
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: `3px solid ${C.border}`, borderTopColor: C.saffron, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1rem' }} />
          <p style={{ color: C.textMuted, fontFamily: "'Outfit', sans-serif" }}>Loading reviews...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: C.cream, minHeight: '100vh', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 500, fontFamily: "'Outfit', sans-serif" }}
        >
          ← Back
        </button>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', border: `1px solid #FCA5A5`, padding: '1rem', borderRadius: 12, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* User Header */}
        {userData && (
          <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 16, padding: '2rem', marginBottom: '2rem', animation: 'fadeUp 0.5s ease both' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ width: 120, height: 120, borderRadius: 16, overflow: 'hidden', background: C.cream, border: `2px solid ${C.border}`, flexShrink: 0 }}>
                {userData.ProfilePic ? (
                  <img src={userData.ProfilePic} alt={userData.FullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: C.textFaint, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>
                    {userData.FullName?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 700, color: C.textDark, margin: '0 0 0.5rem' }}>
                  {userData.FullName}
                </h1>
                <p style={{ color: C.textMuted, margin: '0 0 1rem', fontSize: '0.95rem' }}>
                  {userData.City || 'Location not set'}
                </p>

                {stats && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ color: C.textFaint, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>Average Rating</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: C.maroon }}>{stats.avgRating}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} style={{ fontSize: '0.9rem', color: star <= Math.round(stats.avgRating) ? C.saffronDark : '#d1d5db' }}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p style={{ color: C.textFaint, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>Total Reviews</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: C.textDark, margin: 0 }}>{stats.totalReviews}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rating Distribution */}
        {stats && (
          <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 16, padding: '2rem', marginBottom: '2rem', animation: 'fadeUp 0.5s ease 0.08s both' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 700, color: C.textDark, margin: '0 0 1.5rem', borderBottom: `1px solid ${C.border}`, paddingBottom: '0.75rem' }}>
              Rating Distribution
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.distribution[rating];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ minWidth: 80, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} style={{ fontSize: '0.85rem', color: star <= rating ? C.saffronDark : '#d1d5db' }}>★</span>
                      ))}
                    </div>
                    <div style={{ flex: 1, height: 12, background: C.cream, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                      <div style={{ height: '100%', width: `${percentage}%`, background: C.saffronDark, transition: 'width 0.3s ease' }} />
                    </div>
                    <div style={{ minWidth: 40, textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: C.textMuted }}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div style={{ animation: 'fadeUp 0.5s ease 0.16s both' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 700, color: C.textDark, margin: '0 0 1.5rem', borderBottom: `1px solid ${C.border}`, paddingBottom: '0.75rem' }}>
            All Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: C.textMuted, fontSize: '1rem', marginBottom: '0.5rem' }}>No reviews yet</p>
              <p style={{ color: C.textFaint, fontSize: '0.9rem', margin: 0 }}>This user hasn't received any reviews yet. Complete some bookings to build credibility.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((review, index) => (
                <div
                  key={review.ReviewID}
                  style={{
                    background: C.warmWhite,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    padding: '1.5rem',
                    animation: `fadeUp 0.5s ease ${0.16 + index * 0.05}s both`,
                  }}
                >
                  {/* Reviewer Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', background: C.cream, border: `1px solid ${C.border}`, flexShrink: 0 }}>
                      {review.ReviewerPic ? (
                        <img src={review.ReviewerPic} alt={review.ReviewerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: C.textFaint, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>
                          {review.ReviewerName?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700, color: C.textDark, margin: '0 0 2px', fontSize: '0.95rem' }}>{review.ReviewerName}</h3>
                      <p style={{ color: C.textFaint, fontSize: '0.8rem', margin: 0 }}>
                        {new Date(review.CreatedAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {renderStars(review.Rating)}
                    </div>
                  </div>

                  {/* Asset Info */}
                  {review.AssetTitle && (
                    <p style={{ color: C.textMuted, fontSize: '0.85rem', margin: '0 0 0.75rem', fontStyle: 'italic' }}>
                      For: {review.AssetTitle}
                    </p>
                  )}

                  {/* Review Comment */}
                  <p style={{ color: C.textDark, fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                    "{review.Comment || 'No comment provided'}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
