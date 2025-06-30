import knex from "/opt/nodejs/db.js";

export const bulkUpdateInChunks = async (tableName, updates, chunkSize = 100) => {
    if (!updates || updates.length === 0) return 0;

    let totalUpdated = 0;
    
    for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        
        await knex.transaction(async (trx) => {
            const updatePromises = chunk.map(record => {
                const { id, ...updateData } = record;
                return trx(tableName).where('id', id).update(updateData);
            });
            
            await Promise.all(updatePromises);
        });
        
        totalUpdated += chunk.length;
    }
    
    return totalUpdated;
};

export const prepareUpdatesFromResults = (results) => {
    return results
        .filter(result => result.website_uri)
        .map(result => ({
            id: result.id,
            is_website_uri_status_404: result.is_website_uri_status_404,
            is_website_uri_https_verified: result.is_website_uri_https_verified,
            does_address_match_website: result.address?.isMatch || false,
            do_hours_match_website: result.hours?.isMatch || false,
        }));
};
