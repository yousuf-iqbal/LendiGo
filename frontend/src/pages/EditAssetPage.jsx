import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import LocationPickerMap from "../components/LocationPickerMap";

export default function EditAssetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price_per_day: "",
    location: "Lahore",
    area: "",
    lat: null,
    lng: null,
  });
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    try {
      const res = await API.get(`/assets/${id}`);
      setForm({
        name: res.data.name,
        description: res.data.description,
        category: res.data.category,
        price_per_day: res.data.price_per_day.toString(),
        location: res.data.location || 'Lahore',
        area: res.data.area || '',
        lat: res.data.lat ? parseFloat(res.data.lat) : null,
        lng: res.data.lng ? parseFloat(res.data.lng) : null,
      });
      if (res.data.images) {
        setExistingImages(res.data.images);
      }
    } catch (err) {
      console.error('Error fetching asset:', err);
      setErrors({ general: 'Failed to load asset details' });
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.category) errs.category = "Select a category";
    if (!form.price_per_day || parseFloat(form.price_per_day) < 0) errs.price_per_day = "Valid price required";
    if (!form.area || !form.lat || !form.lng) errs.location = "Pick your area on the Lahore map";
    return errs;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + images.length;
    
    if (files.length + totalImages > 5) {
      setErrors(prev => ({ ...prev, images: `Maximum 5 images allowed (you have ${totalImages})` }));
      return;
    }
    
    setImages(prev => [...prev, ...files]);
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...urls]);
    setErrors(prev => ({ ...prev, images: "" }));
  };

  const removeNewImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId) => {
    // For now, just remove from state (backend delete would go here)
    setExistingImages(prev => prev.filter(img => img.ImageID !== imageId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('location', 'Lahore');
      formData.append('area', form.area);
      formData.append('lat', String(form.lat));
      formData.append('lng', String(form.lng));
      ['name', 'description', 'category', 'price_per_day'].forEach((key) => {
        if (form[key]) formData.append(key, form[key]);
      });
      images.forEach(image => formData.append('images', image));

      await API.put(`/assets/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      navigate(`/assets/${id}`);
    } catch (err) {
      console.error("Error:", err.response?.data);
      setErrors({ general: err.response?.data?.error || "Failed to update asset" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => navigate("/my-assets")}
          style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← My Assets
        </button>
        
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.5rem' }}>Edit Asset</h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Update your asset details</p>

        <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {errors.general && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              {errors.general}
            </div>
          )}

          {/* Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Asset Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${errors.name ? '#dc2626' : '#d1d5db'}` }}
              placeholder="e.g., Canon EOS M50 Camera"
            />
            {errors.name && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.name}</p>}
          </div>

          {/* Category & Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Category *</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${errors.category ? '#dc2626' : '#d1d5db'}` }}
                placeholder="e.g., Electronics"
              />
              {errors.category && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.category}</p>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Price per Day (Rs.) *</label>
              <input
                type="number"
                value={form.price_per_day}
                onChange={(e) => setForm(prev => ({ ...prev, price_per_day: e.target.value }))}
                min="0"
                step="0.01"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${errors.price_per_day ? '#dc2626' : '#d1d5db'}` }}
                placeholder="1500"
              />
              {errors.price_per_day && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.price_per_day}</p>}
            </div>
          </div>

          <LocationPickerMap
            area={form.area}
            lat={form.lat}
            lng={form.lng}
            error={errors.location}
            onChange={(loc) => setForm(prev => ({
              ...prev,
              area: loc.area,
              lat: loc.lat,
              lng: loc.lng,
              location: loc.city,
            }))}
          />

          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows="4"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              placeholder="Describe your asset..."
            />
          </div>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Current Images</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                {existingImages.map((img, index) => (
                  <div key={img.ImageID} style={{ position: 'relative' }}>
                    <img src={img.ImageURL} alt={`Existing ${index + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.ImageID)}
                      style={{
                        position: 'absolute', top: '4px', right: '4px',
                        background: '#dc2626', color: '#fff', border: 'none',
                        borderRadius: '50%', width: '24px', height: '24px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                    {img.IsPrimary && (
                      <div style={{
                        position: 'absolute', bottom: '4px', left: '4px',
                        background: 'rgba(5, 150, 105, 0.9)', color: '#fff',
                        padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem'
                      }}>
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
              Add More Images {existingImages.length + images.length >= 5 ? '(Max 5 reached)' : `(Max ${5 - existingImages.length - images.length} more)`}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={existingImages.length + images.length >= 5}
              style={{ marginBottom: '1rem' }}
            />
            {errors.images && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{errors.images}</p>}
            
            {previewUrls.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                {previewUrls.map((url, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img src={url} alt={`New ${index + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      style={{
                        position: 'absolute', top: '4px', right: '4px',
                        background: '#dc2626', color: '#fff', border: 'none',
                        borderRadius: '50%', width: '24px', height: '24px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate("/my-assets")}
              disabled={loading}
              style={{ flex: 1, padding: '1rem', background: '#e5e7eb', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '1rem', background: loading ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Updating...' : 'Update Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}