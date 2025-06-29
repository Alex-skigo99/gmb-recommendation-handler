export const buildFullAddress = (location) => {
  const addressParts = [];
  
  // Add address lines
  if (location.address_lines && Array.isArray(location.address_lines)) {
    addressParts.push(...location.address_lines);
  }
  
  // Add locality (city)
  if (location.locality) {
    addressParts.push(location.locality);
  }
  
  // Add sublocality if available
  if (location.sublocality) {
    addressParts.push(location.sublocality);
  }
  
  // Add administrative area (state/province)
  if (location.administrative_area) {
    addressParts.push(location.administrative_area);
  }
  
  // Add postal code
  if (location.postal_code) {
    addressParts.push(location.postal_code);
  }
  
  return addressParts.join(' ').trim();
};
