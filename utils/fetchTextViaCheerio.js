import * as cheerio from 'cheerio';
import axios from 'axios';

const REQUEST_TIMEOUT = 5000;

export const fetchTextViaCheerio = async (location, websiteUrl) => {
    console.log(`Checking address match for ${location.business_name} at ${websiteUrl}`);
    
    if (!websiteUrl || !location) {
        return {
            isMatch: false,
            error: 'Missing website URL or location data'
        };
    }
    
    try {
        const response = await axios.get(websiteUrl, {
        timeout: REQUEST_TIMEOUT,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
        maxRedirects: 5,
        validateStatus: function (status) {
            return status >= 200 && status < 400;
        }
        });
        
        const html = response.data;
        const $ = cheerio.load(html);
        const websiteText = $.text();
        
        console.log(`Extracted text from website: ${websiteText.length} characters`);
        
        return websiteText;
        
    } catch (error) {
        console.error(`Error checking address match for ${location.business_name}:`, error);
        
    }
};
