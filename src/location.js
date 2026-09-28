export function parseCoordinates(location) {
  const latitudeText = String(location.latitude ?? "").trim();
  const longitudeText = String(location.longitude ?? "").trim();
  if (!latitudeText || !longitudeText) return null;

  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  if (
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
  ) return null;

  return { latitude, longitude };
}

export function locationMapUrls(location) {
  const point = parseCoordinates(location);
  if (!point) return null;

  const { latitude, longitude } = point;
  const bounds = [longitude - 0.005, latitude - 0.003, longitude + 0.005, latitude + 0.003];
  const query = `mlat=${latitude}&mlon=${longitude}`;
  return {
    page: `https://www.openstreetmap.org/?${query}#map=17/${latitude}/${longitude}`,
    embed: `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.map((value) => value.toFixed(6)).join("%2C")}&layer=mapnik&marker=${latitude}%2C${longitude}`,
  };
}
