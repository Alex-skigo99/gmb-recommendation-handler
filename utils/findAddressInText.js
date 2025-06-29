const variantsOfAddress = (address) => {
    if (!address || typeof address !== 'string') return [];
    if (!isNaN(address)) return [address];
    const lower = address.toLowerCase();
    const upper = address.toUpperCase();
    const capitalized = address
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    return [address, upper, lower, capitalized];
};

export const findAddressInText = (location, websiteText) => {
    
    if (!websiteText || !location) {
      return {
        isMatch: false,
        error: 'Missing website text or location data'
      };
    }
    
    const fullAddress = location.address_lines.join(' ');
    console.log(`Checking address match for ${location.business_name} at ${fullAddress}`);

    // search for exact match to variants first
    const variants = variantsOfAddress(fullAddress);
    console.log(`Checking for address variants: ${variants.join(', ')}`);
    for (let variant of variants) {
        const isOnWebsite = websiteText.indexOf(variant) > -1;
        console.log(`Checking variant: ${variant} - Found: ${isOnWebsite}`);
        if (isOnWebsite) {
            return {
                isMatch: true,
                error: null,
            };
        }
    }

    //Find index of postal code in website text
    const postalCodeIndex = websiteText.indexOf(location.postal_code);
    console.log(`Postal code index: ${postalCodeIndex}`);
    if (postalCodeIndex === -1) {
        console.log(`Postal code ${location.postal_code} not found in website text`);
        return {
            isMatch: false,
            error: 'Postal code not found in website text'
        };
    }

    // If no exact match, check for address components
    const startSearchIndex = Math.max(0, postalCodeIndex - 100); // Search 100 characters before postal code
    const searchText = websiteText.substring(startSearchIndex, postalCodeIndex + location.postal_code.length + 100); // Search 100 characters after postal code
    console.log(`Searching for address components in text: "${searchText}"`);

    const addressComponents = fullAddress.split(' ').map(component => component.trim()).filter(component => component.length > 0);
    let addressComponentsLength = addressComponents.length;
    console.log(`Address components to match: ${addressComponents}`);

    let matchedAddress = [];
    for (let component of addressComponents) {
        const addressComponentVariants = variantsOfAddress(component);
        let isMatched = false;
        for (let variant of addressComponentVariants) {
            const isComponentOnWebsite = searchText.includes(variant);
            console.log(`Checking variant: ${variant} - Found: ${isComponentOnWebsite}`);
            if (isComponentOnWebsite) {
                isMatched = true;
                break;
            }
        }
        console.log(`Checking component: ${component} - Found: ${isMatched}`);
        if (isMatched) {
            matchedAddress.push(component);
        }
    }
    console.log(`Found addresses in text: ${matchedAddress.join(', ')}`);

    if (matchedAddress.length === addressComponentsLength) {
        return {
            isMatch: true,
            error: null,
            matchedAddress: matchedAddress
        };
    }

    return {
      isMatch: false,
      error: 'Address not found'
    };
};
