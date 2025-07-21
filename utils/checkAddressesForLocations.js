import { fetchTextViaCheerio } from './fetchTextViaCheerio.js';
// import { findTextWithoutAi } from './findTextWithoutAi.js';
import { findUsingAi } from './findUsingAi.js';

const processLocationAddress = async (location) => {
  if (!location.website_uri) {
    return {
      id: location.id,
      business_name: location.business_name,
      address: {
        isMatch: false,
        isFound: false,
      },
      hours: {
        isMatch: false,
        isFound: false,
      },
      phone: {
        isMatch: null,
        isFound: null,
      },
      error: 'No website URL available'
    };
  }
  
  try {
    console.log(`Processing address for ${location.business_name}...`);
    
    const websiteText = await fetchTextViaCheerio(location, location.website_uri);

    if (!websiteText) {
      return {
        id: location.id,
        business_name: location.business_name,
        address: {
          isMatch: null,
          isFound: null,
        },
        hours: {
          isMatch: null,
          isFound: null,
        },
        phone: {
          isMatch: null,
          isFound: null,
        },
        error: "Failed to parse GPT response",
      };
    }

    // Use AI-based checking (can switch to findTextWithoutAi if needed)
    const result = await findUsingAi(location, websiteText);

    return {
      id: location.id,
      business_name: location.business_name,
      ...result
    };
    
  } catch (error) {
    console.error(`Error processing location ${location.id}:`, error);
    return {
      id: location.id,
      business_name: location.business_name,
      address: {
        isMatch: null,
        isFound: null,
      },
      hours: {
        isMatch: null,
        isFound: null,
      },
      phone: {
        isMatch: null,
        isFound: null,
      },
      error: error.message
    };
  }
};

const processLocationChunk = async (chunk, chunkIndex, totalChunks) => {
  console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks} (${chunk.length} locations)`);
  
  const chunkResults = await Promise.allSettled(
    chunk.map(location => processLocationAddress(location))
  );
  
  const processedResults = chunkResults.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`Failed to process location in chunk ${chunkIndex + 1}:`, result.reason);
      return {
        id: chunk[index].id,
        business_name: chunk[index].business_name,
        isMatch: false,
        error: `Processing failed: ${result.reason.message}`
      };
    }
  });
  
  console.log(`Completed chunk ${chunkIndex + 1}/${totalChunks}`);
  return processedResults;
};

export const checkAddressesForLocations = async (locations, options = {}) => {
  const {
    chunkSize = 5,
    delayBetweenChunks = 1000,
  } = options;
  
  if (!locations || locations.length === 0) {
    console.log('No locations to process');
    return [];
  }
  
  console.log(`Starting address check for ${locations.length} locations with chunk size ${chunkSize}`);
  
  const chunks = [];
  for (let i = 0; i < locations.length; i += chunkSize) {
    chunks.push(locations.slice(i, i + chunkSize));
  }
  
  console.log(`Created ${chunks.length} chunks`);
  
  const allResults = [];
  const startTime = Date.now();
  
  console.log('Starting sequential chunk processing');

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      const chunkResults = await processLocationChunk(chunk, i, chunks.length);
      allResults.push(...chunkResults);
      
      if (i < chunks.length - 1 && delayBetweenChunks > 0) {
        console.log(`Waiting ${delayBetweenChunks}ms before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
      }
      
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
      
      chunk.forEach(location => {
        allResults.push({
          id: location.id,
          business_name: location.business_name,
          address: {
            isMatch: null,
            isFound: null,
          },
          hours: {
            isMatch: null,
            isFound: null,
          },
          phone: {
            isMatch: null,
            isFound: null,
          },
          error: `Chunk processing failed: ${error.message}`
        });
      });
    }
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log(`✅ Address checking completed in ${totalTime}ms`);
  console.log(`📊 Processed ${allResults.length} locations`);
  
  const successfulMatches = allResults.filter(r => r.isMatch).length;
  const errors = allResults.filter(r => r.error && r.error !== 'No website URL available').length;
  const noWebsite = allResults.filter(r => r.error === 'No website URL available').length;
  
  console.log(`📈 Results: ${successfulMatches} matches, ${errors} errors, ${noWebsite} no website`);
  
  return allResults;
};
