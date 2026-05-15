// Major Lahore neighborhoods with approximate centroids for map snapping
export const LAHORE_CENTER = [31.5204, 74.3587];
export const LAHORE_ZOOM = 12;
export const LAHORE_BOUNDS = [
  [31.35, 74.15],
  [31.65, 74.45],
];

export const LAHORE_AREAS = [
  { name: 'DHA Phase 1', lat: 31.4697, lng: 74.4104 },
  { name: 'DHA Phase 2', lat: 31.4628, lng: 74.4012 },
  { name: 'DHA Phase 3', lat: 31.4556, lng: 74.3921 },
  { name: 'DHA Phase 4', lat: 31.4489, lng: 74.3834 },
  { name: 'DHA Phase 5', lat: 31.4412, lng: 74.3745 },
  { name: 'DHA Phase 6', lat: 31.4345, lng: 74.3656 },
  { name: 'Gulberg I', lat: 31.5201, lng: 74.3436 },
  { name: 'Gulberg II', lat: 31.5156, lng: 74.3512 },
  { name: 'Gulberg III', lat: 31.5102, lng: 74.3589 },
  { name: 'Model Town', lat: 31.4845, lng: 74.3234 },
  { name: 'Johar Town', lat: 31.4698, lng: 74.2912 },
  { name: 'Bahria Town', lat: 31.3689, lng: 74.1856 },
  { name: 'Cantt', lat: 31.5345, lng: 74.3789 },
  { name: 'Garden Town', lat: 31.5089, lng: 74.3345 },
  { name: 'Faisal Town', lat: 31.4789, lng: 74.3012 },
  { name: 'Iqbal Town', lat: 31.5234, lng: 74.2789 },
  { name: 'Township', lat: 31.4567, lng: 74.3123 },
  { name: 'Valencia Town', lat: 31.4123, lng: 74.2567 },
  { name: 'Wapda Town', lat: 31.4456, lng: 74.2678 },
  { name: 'Allama Iqbal Town', lat: 31.5123, lng: 74.2890 },
  { name: 'Shadman', lat: 31.5456, lng: 74.3234 },
  { name: 'Liberty Market', lat: 31.5089, lng: 74.3456 },
  { name: 'Defence Raya', lat: 31.4289, lng: 74.3567 },
  { name: 'Askari 10', lat: 31.4789, lng: 74.4123 },
  { name: 'Askari 11', lat: 31.4712, lng: 74.4234 },
  { name: 'Cavalry Ground', lat: 31.5234, lng: 74.3890 },
  { name: 'Mall Road', lat: 31.5567, lng: 74.3234 },
  { name: 'Anarkali', lat: 31.5678, lng: 74.3123 },
  { name: 'Old City (Walled City)', lat: 31.5890, lng: 74.3123 },
  { name: 'Shahdara', lat: 31.6123, lng: 74.2890 },
  { name: 'Ravi Town', lat: 31.5789, lng: 74.3345 },
  { name: 'Samnabad', lat: 31.5345, lng: 74.3012 },
  { name: 'Harbanspura', lat: 31.5456, lng: 74.3567 },
  { name: 'Green Town', lat: 31.4678, lng: 74.2789 },
  { name: 'Sabzazar', lat: 31.4567, lng: 74.2890 },
  { name: 'Lake City', lat: 31.3789, lng: 74.2456 },
  { name: 'EME Society', lat: 31.4234, lng: 74.2345 },
  { name: 'Paragon City', lat: 31.4012, lng: 74.2678 },
  { name: 'Thokar Niaz Baig', lat: 31.4456, lng: 74.2456 },
  { name: 'Raiwind Road', lat: 31.3890, lng: 74.2123 },
];

export function findNearestArea(lat, lng) {
  let nearest = LAHORE_AREAS[0];
  let minDist = Infinity;
  for (const area of LAHORE_AREAS) {
    const d = (area.lat - lat) ** 2 + (area.lng - lng) ** 2;
    if (d < minDist) {
      minDist = d;
      nearest = area;
    }
  }
  return nearest;
}

export function isWithinLahore(lat, lng) {
  return (
    lat >= LAHORE_BOUNDS[0][0] &&
    lat <= LAHORE_BOUNDS[1][0] &&
    lng >= LAHORE_BOUNDS[0][1] &&
    lng <= LAHORE_BOUNDS[1][1]
  );
}
