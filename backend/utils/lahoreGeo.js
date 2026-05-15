const DEFAULT_CITY = 'Lahore';

const LAHORE_BOUNDS = {
  minLat: 31.35,
  maxLat: 31.65,
  minLng: 74.15,
  maxLng: 74.45,
};

function isWithinLahore(lat, lng) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return (
    latitude >= LAHORE_BOUNDS.minLat &&
    latitude <= LAHORE_BOUNDS.maxLat &&
    longitude >= LAHORE_BOUNDS.minLng &&
    longitude <= LAHORE_BOUNDS.maxLng
  );
}

function validateLocation({ area, lat, lng, city }) {
  const errors = [];

  if (!area || !String(area).trim()) {
    errors.push('Area is required — pick your neighborhood on the map');
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    errors.push('Map location is required — tap on the map or select an area');
  } else if (!isWithinLahore(latitude, longitude)) {
    errors.push('Location must be within Lahore');
  }

  const resolvedCity = (city && String(city).trim()) || DEFAULT_CITY;
  if (resolvedCity.toLowerCase() !== 'lahore') {
    errors.push('Only Lahore locations are supported at this time');
  }

  return {
    valid: errors.length === 0,
    errors,
    area: area ? String(area).trim() : '',
    city: DEFAULT_CITY,
    lat: latitude,
    lng: longitude,
  };
}

module.exports = {
  DEFAULT_CITY,
  LAHORE_BOUNDS,
  isWithinLahore,
  validateLocation,
};
