import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./MyAssetsPage.css";

const getCategoryImage = (category) => {
  const images = {
    'Electronics': 'https://cdn-icons-png.flaticon.com/512/1055/1055685.png',
    'Tools': 'https://cdn-icons-png.flaticon.com/512/2963/2963308.png',
    'Party Supplies': 'https://cdn-icons-png.flaticon.com/512/2963/2963198.png',
    'Vehicles': 'https://cdn-icons-png.flaticon.com/512/2963/2963201.png',
    'Sports': 'https://cdn-icons-png.flaticon.com/512/2963/2963206.png',
  };
  return images[category] || 'https://cdn-icons-png.flaticon.com/512/1055/1055685.png';
};

function AssetCard({ asset, onToggle, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Remove this asset?")) return;
    setDeleting(true);
    await onDelete(asset.asset_id);
    setDeleting(false);
  };

  return (
    <div className="my-asset-card">
      <div className="my-asset-card__image" onClick={() => window.location.href = `/assets/${asset.asset_id}`}>
        <img src={getCategoryImage(asset.category)} alt={asset.name} />
        <span className={`my-asset-card__status ${asset.availability_status === "available" ? "status-available" : "status-unavailable"}`}>
          {asset.availability_status}
        </span>
      </div>
      <div className="my-asset-card__body">
        <h3 className="my-asset-card__name">{asset.name}</h3>
        <p className="my-asset-card__category">{asset.category || "Uncategorised"}</p>
        <div className="my-asset-card__price">
          {asset.price_per_day ? `Rs ${Number(asset.price_per_day).toLocaleString()}/day` : "Free"}
        </div>
        <div className="my-asset-card__actions">
          <Link to={`/assets/${asset.asset_id}`} className="my-asset-card__btn btn-view">
            View
          </Link>
          <button className="my-asset-card__btn btn-toggle" onClick={() => onToggle(asset.asset_id, asset.availability_status)}>
            {asset.availability_status === "available" ? "Mark Unavailable" : "Mark Available"}
          </button>
          <button className="my-asset-card__btn btn-delete" onClick={handleDelete} disabled={deleting}>
            {deleting ? "..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyAssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("udhaari_user") || "null");

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = user?.UserID || user?.id;
      
      if (!userId) {
        navigate("/login");
        return;
      }
      
      const { data } = await axios.get(`http://localhost:5000/api/assets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userAssets = data.filter(asset => asset.owner_id === userId);
      setAssets(userAssets);
    } catch (err) {
      console.error("Error fetching assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (assetId, currentStatus) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === "available" ? 0 : 1;
    try {
      await axios.patch(`http://localhost:5000/api/assets/${assetId}`, 
        { isActive: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (assetId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5000/api/assets/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="my-assets-page"><div className="my-assets__inner">Loading your assets...</div></div>;
  }

  return (
    <div className="my-assets-page">
      <div className="my-assets__inner">
        <div className="my-assets__header">
          <div>
            <h1 className="my-assets__title">My Assets</h1>
            <p className="my-assets__subtitle">Items you have listed for lending</p>
          </div>
          <Link to="/my-assets/add" className="my-assets__add-btn">
            + Add Asset
          </Link>
        </div>

        {assets.length === 0 ? (
          <div className="my-assets__empty">
            <p>No assets listed yet.</p>
            <Link to="/my-assets/add" className="my-assets__add-btn">List your first asset</Link>
          </div>
        ) : (
          <div className="my-assets__grid">
            {assets.map((asset) => (
              <AssetCard
                key={asset.asset_id}
                asset={asset}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
