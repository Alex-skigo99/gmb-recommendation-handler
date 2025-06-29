import { checkAddressesForLocations } from './utils/checkAddressesForLocations.js';

const mockLocations = [
  {
    id: "test-1",
    business_name: "Estero Garage Door Repair Services",
    address_lines: ["9200 ESTERO PARK COMMONS BLVD #6"],
    locality: "ESTERO",
    administrative_area: "FL",
    postal_code: "33928",
    website_uri: "http://esterogaragedoorrepair.com/",
    regular_hours: {
        "periods": [
          {
            "openDay": "SUNDAY",
            "openTime": {},
            "closeDay": "SUNDAY",
            "closeTime": {
              "hours": 24
            }
          },
          {
            "openDay": "MONDAY",
            "openTime": {},
            "closeDay": "MONDAY",
            "closeTime": {
              "hours": 24
            }
          },
          {
            "openDay": "TUESDAY",
            "openTime": {},
            "closeDay": "TUESDAY",
            "closeTime": {
              "hours": 24
            }
          },
          {
            "openDay": "WEDNESDAY",
            "openTime": {},
            "closeDay": "WEDNESDAY",
            "closeTime": {
              "hours": 24
            }
          },
          {
            "openDay": "THURSDAY",
            "openTime": {},
            "closeDay": "THURSDAY",
            "closeTime": {
              "hours": 24
            }
          },
          {
            "openDay": "FRIDAY",
            "openTime": {},
            "closeDay": "FRIDAY",
            "closeTime": {
              "hours": 24
            }
          },
          {
            "openDay": "SATURDAY",
            "openTime": {},
            "closeDay": "SATURDAY",
            "closeTime": {
              "hours": 24
            }
          }
        ]
    },
  },
//   {
//     id: "test-2", 
//     business_name: "Miami's Sliding Door & Window Repairs",
//     address_lines: ["450 SW 9TH ST SUITE #102"],
//     locality: "Miami",
//     administrative_area: "FL", 
//     postal_code: "33140",
//     website_uri: "https://slidingdoorrepairsmiami.com/"
//   },
//   {
//     id: "test-3",
//     business_name: "MY DOOR NYC",
//     address_lines: ["104 w 40 st", "Unit: Concourse 2"],
//     locality: "new york",
//     administrative_area: "NY",
//     postal_code: "10018",
//     website_uri: "https://mydoornyc.com/"
//   }
];

async function testMultipleLocations() {
  console.log('\n=== Testing Multiple Locations ===');
  
  try {
    const results = await checkAddressesForLocations(mockLocations);
    if (!results || results.length === 0) {
        console.log('No results returned from data check.');
        return;
    }
    console.log('Results:');
    results.forEach((result, index) => {
        console.log(`\n--- Location ${index + 1} ---`);
        console.log(`Result: ${JSON.stringify(result)}`);
        console.log(`Business: ${result.business_name}`);
        console.log(`Address Match: ${result.address.isMatch}`);
        console.log(`Address Error: ${result.address.error || 'None'}`);
        if (result.address.matchedAddress) {
            console.log(`Matched Address: ${result.address.matchedAddress}`);
        }
        if (result.hours) {
            console.log(`Hours Match: ${result.hours.isMatch}`);
            console.log(`Hours Error: ${result.hours.error || 'None'}`);
            if (result.hours.matchedHours) {
                console.log(`Matched Hours: ${JSON.stringify(result.hours.matchedHours, null, 2)}`);
            }
        }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

async function runTests() {
  console.log('Starting Address Check Tests...\n');
  
  await testMultipleLocations();
  
  console.log('\n=== Tests Completed ===');
}

runTests().catch(console.error);
