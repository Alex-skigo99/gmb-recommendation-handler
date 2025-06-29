import { checkAddressesForLocations } from './utils/checkAddressesForLocations.js';

const mockLocations = [
  {
    id: "test-1",
    business_name: "Estero Garage Door Repair Services",
    address_lines: ["9200 ESTERO PARK COMMONS BLVD #6"],
    locality: "ESTERO",
    administrative_area: "FL",
    postal_code: "33928",
    website_uri: "http://esterogaragedoorrepair.com/"
  },
  {
    id: "test-2", 
    business_name: "Miami's Sliding Door & Window Repairs",
    address_lines: ["450 SW 9TH ST SUITE #102"],
    locality: "Miami",
    administrative_area: "FL", 
    postal_code: "33140",
    website_uri: "https://slidingdoorrepairsmiami.com/"
  },
  {
    id: "test-3",
    business_name: "MY DOOR NYC",
    address_lines: ["104 w 40 st", "Unit: Concourse 2"],
    locality: "new york",
    administrative_area: "NY",
    postal_code: "10018",
    website_uri: "https://mydoornyc.com/"
  }
];

async function testMultipleLocations() {
  console.log('\n=== Testing Multiple Locations ===');
  
  try {
    const results = await checkAddressesForLocations(mockLocations);
    console.log('Results:');
    await Promise.all(results.map(async (result, index) => {
        console.log(`\n--- Location ${index + 1} ---`);
        console.log(`Business: ${result.business_name}`);
        console.log(`Match: ${result.isMatch}`);
        console.log(`Error: ${result.error || 'None'}`);
        console.log(`Result: ${JSON.stringify(result)}`);
        if (result.matchedAddress) {
        console.log(`Matched Address: ${result.matchedAddress}`);
        }
    }));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Main execution
async function runTests() {
  console.log('Starting Address Check Tests...\n');
  
  await testMultipleLocations();
  
  console.log('\n=== Tests Completed ===');
}

runTests().catch(console.error);
