import { fetchTextViaCheerio } from './fetchTextViaCheerio.js';
import { findTextWithoutAi } from './findTextWithoutAi.js';
import { findUsingAi } from './findUsingAi.js';

export const checkAddressesForLocations = async (locations) => {
  const results = [];
  
  for (const location of locations) {
    if (!location.website_uri) {
      results.push({
        id: location.id,
        business_name: location.business_name,
        isMatch: false,
        error: 'No website URL available'
      });
      continue;
    }
    
    try {
      const websiteText = await fetchTextViaCheerio(location, location.website_uri);

      if (!websiteText) {
        results.push({
          id: location.id,
          business_name: location.business_name,
          isMatch: false,
          error: 'No website text available'
        });
        continue;
      }

      // const result = findTextWithoutAi(location, websiteText);

      const result = await findUsingAi(location, websiteText);

      results.push({
        id: location.id,
        business_name: location.business_name,
        ...result
      });
      
    } catch (error) {
      console.error(`Error processing location ${location.id}:`, error);
      results.push({
        id: location.id,
        business_name: location.business_name,
        isMatch: false,
        error: error.message
      });
    }
  }
  
  return results;
};
