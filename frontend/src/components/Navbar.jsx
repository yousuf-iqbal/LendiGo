import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    // Check for user in localStorage using correct key
    const userData = localStorage.getItem("udhaari_user") || localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch(e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("udhaari_user");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-mark">U</span>
          <span className="navbar__logo-text">dhaari</span>
        </Link>

        <div className="navbar__links">
          <Link to="/browse" className={`navbar__link ${isActive("/browse") ? "navbar__link--active" : ""}`}>Browse</Link>
          <Link to="/requests" className={`navbar__link ${isActive("/requests") ? "navbar__link--active" : ""}`}>Requests</Link>
          {user && (
            <>
              <Link to="/my-assets" className={`navbar__link ${isActive("/my-assets") ? "navbar__link--active" : ""}`}>My Assets</Link>
              <Link to="/bookings" className={`navbar__link ${isActive("/bookings") ? "navbar__link--active" : ""}`}>Bookings</Link>
            </>
          )}
        </div>

        <div className="navbar__actions">
          {user ? (
            <>
              <Link to="/profile" className="navbar__profile">
                <div className="navbar__avatar">{user.fullName?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || "U"}</div>
              </Link>
              <button onClick={handleLogout} className="navbar__btn navbar__btn--ghost">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__btn navbar__btn--ghost">Sign in</Link>
              <Link to="/signup" className="navbar__btn navbar__btn--solid">Join</Link>
            </>
          )}
        </div>

        <button className="navbar__burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className={menuOpen ? "open" : ""} />
          <span className={menuOpen ? "open" : ""} />
        </button>
      </div>

      <div className={`navbar__mobile ${menuOpen ? "navbar__mobile--open" : ""}`}>
        <Link to="/browse" className="navbar__mobile-link">Browse</Link>
        <Link to="/requests" className="navbar__mobile-link">Requests</Link>
        {user && (
          <>
            <Link to="/my-assets" className="navbar__mobile-link">My Assets</Link>
            <Link to="/bookings" className="navbar__mobile-link">Bookings</Link>
            <Link to="/profile" className="navbar__mobile-link">Profile</Link>
            <button onClick={handleLogout} className="navbar__mobile-link navbar__mobile-logout">Sign out</button>
          </>
        )}
        {!user && (
          <>
            <Link to="/login" className="navbar__mobile-link">Sign in</Link>
            <Link to="/signup" className="navbar__mobile-link">Join</Link>
          </>
        )}
      </div>
    </nav>
  );
}
