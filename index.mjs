import knex from "/opt/nodejs/db.js";
import DatabaseTableConstants from "/opt/nodejs/DatabaseTableConstants.js";
import https from 'https';
import http from 'http';
import { URL } from 'url';

async function checkWebsiteStatus(websiteUri) {
    if (!websiteUri) {
        return { isAccessible: false, supportsHttps: false };
    }

    try {
        let normalizedUri = websiteUri;
        if (!websiteUri.startsWith('http://') && !websiteUri.startsWith('https://')) {
            normalizedUri = 'https://' + websiteUri;
        }
        const url = new URL(normalizedUri);
        
        const supportsHttps = await checkWebsiteWithProtocol(url, true);
        
        if (supportsHttps) {
            return { isAccessible: true, supportsHttps: true };
        }
        const isAccessible = await checkWebsiteWithProtocol(url, false);

        return { isAccessible, supportsHttps: false };
    } catch (error) {
        console.error(`Error checking website ${websiteUri}:`, error.message);
        return { isAccessible: false, supportsHttps: false };
    }
}

function checkWebsiteWithProtocol(url, useHttps = true) {
    return new Promise((resolve) => {
        const targetUrl = new URL(url.href);
        targetUrl.protocol = useHttps ? 'https:' : 'http:';
        
        const module = useHttps ? https : http;
        const port = useHttps ? 443 : 80;

        const options = {
            hostname: targetUrl.hostname,
            port: port,
            path: targetUrl.pathname + targetUrl.search,
            method: 'HEAD',
            timeout: 5000,
            rejectUnauthorized: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            },
        };

        const req = module.request(options, (res) => {
            resolve(res.statusCode < 400);
        });
        req.on('error', () => {
            resolve(false);
        });
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        req.end();
    });
}

async function processWebsitesInBatches(locations, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < locations.length; i += batchSize) {
        const batch = locations.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(locations.length / batchSize)} (${batch.length} websites)`);
        
        const batchPromises = batch.map(async (location) => {
            if (!location.website_uri) {
                return {
                    id: location.id,
                    business_name: location.business_name,
                    website_uri: null,
                    is_website_uri_status_404: null,
                    is_website_uri_https_verified: null
                };
            }

            const { isAccessible, supportsHttps } = await checkWebsiteStatus(location.website_uri);
            
            console.log(`Checked ${location.business_name} (${location.website_uri}): Accessible=${isAccessible}, HTTPS Verified=${supportsHttps}`);
            return {
                id: location.id,
                business_name: location.business_name,
                website_uri: location.website_uri,
                is_website_uri_status_404: !isAccessible,
                is_website_uri_https_verified: supportsHttps
            };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
    }
    
    return results;
}

export const handler = async (event) => {
    console.log("Starting Lambda function to check websites for all GMBs");
    console.log("Event: ", JSON.stringify(event, null, 2));
    const startTime = Date.now();
    
    try {
        console.log("Fetching all locations from database...");
        const locations = await knex(DatabaseTableConstants.GMB_LOCATION_TABLE)
            .select('id', 'business_name', 'website_uri')
            .whereNotNull('website_uri')
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
        const results = await processWebsitesInBatches(locations);

        console.log("Updating database with results...");
        let updatedCount = 0;
        
        for (const result of results) {
            if (result.website_uri) {
                await knex(DatabaseTableConstants.GMB_LOCATION_TABLE)
                    .where('id', result.id)
                    .update({
                        is_website_uri_status_404: result.is_website_uri_status_404,
                        is_website_uri_https_verified: result.is_website_uri_https_verified
                    });
                updatedCount++;
                
                console.log(`Updated ${result.business_name}: 404=${result.is_website_uri_status_404}, HTTPS=${result.is_website_uri_https_verified}`);
            }
        }

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
