import knex from "/opt/nodejs/db.js";
import DatabaseTableConstants from "/opt/nodejs/DatabaseTableConstants.js";
import { bulkUpdateInChunks, prepareUpdatesFromResults } from './utils/bulkUpdate.js';
import { processWebsitesInBatches } from './utils/checkWebsites.js';
import { checkAddressesForLocations } from './utils/checkAddressesForLocations.js';

export const handler = async (event) => {
    console.log("Starting Lambda function to check websites for all GMBs");
    console.log("Event: ", JSON.stringify(event, null, 2));
    const startTime = Date.now();
    
    try {
        console.log("Fetching all locations from database...");
        const locations = await knex(DatabaseTableConstants.GMB_LOCATION_TABLE)
            .select('id', 'business_name', 'website_uri', 'address_lines', 'locality', 'administrative_area', 'postal_code', 'regular_hours')
            .whereNotNull('website_uri')
            .limit(10) // For testing, limit to 10 locations
            .where('website_uri', '!=', '');

        console.log(`Found ${locations.length} locations with website URIs`);

        if (locations.length === 0) {
            console.log("No locations with website URIs found");
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'No locations with website URIs found',
                    processed: 0
                })
            };
        }

        console.log("Starting website checks...");
        const websiteResults = await processWebsitesInBatches(locations);
        console.log(`Processed ${websiteResults.length} websites`);

        console.log('Started address and hours checks for locations...');
        const addressResults = await checkAddressesForLocations(locations);
        console.log(`Address and hours checks completed for ${addressResults.length} locations`);

        const results = websiteResults.map(result => {
            const addressResult = addressResults.find(addr => addr.id === result.id);
            return {
                ...result,
                ...addressResult,
            };
        });

        console.log("Updating database with results...");
        
        const updates = prepareUpdatesFromResults(results);
        
        console.log('updates', updates)
        
        const updatedCount = await bulkUpdateInChunks(
            DatabaseTableConstants.GMB_LOCATION_TABLE, 
            updates,
            50
        );

        console.log(`✅ Successfully bulk updated ${updatedCount} records`);

        const endTime = Date.now();
        const executionTime = endTime - startTime;
        console.log(`⏱️ Lambda execution time: ${executionTime}ms`);
        console.log(`✅ Successfully processed ${updatedCount} websites`);

        const response = {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully checked websites for all GMBs',
                processed: updatedCount,
                executionTime: executionTime
            })
        };
        return response;

    } catch (error) {
        console.error("Error in Lambda function:", error);
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        console.log(`⏱️ Lambda execution time: ${executionTime}ms`);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to check websites',
                message: error.message,
                executionTime: executionTime
            })
        };
    }
};
