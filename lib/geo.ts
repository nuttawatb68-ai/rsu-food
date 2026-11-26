export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function mapsUrl(lat: number, lng: number, placeId?: string) {
  return (
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` +
    (placeId ? `&destination_place_id=${placeId}` : "")
  );
}
