import { OpenAI } from "openai";
import { buildFullAddress } from "./buildFullAddress.js";
import dotenv from "dotenv"; // remove

dotenv.config(); // remove

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1);
  }
  return digits;
}

export async function findUsingAi(location, websiteText) {
  const fullAddress = buildFullAddress(location);
  const targetPhone = location.primary_phone || '';
  console.log(`Finding address, hours, and phone using AI for: ${fullAddress}`);
  console.log(`Target phone: ${targetPhone}`);

  const prompt = `Analyze this website text to find address, business hours, and phone number information.

  TARGET ADDRESS: "${fullAddress}"
  TARGET HOURS: ${JSON.stringify(location.regular_hours?.periods || [])}
  TARGET PHONE: "${targetPhone}"
  
  TASK: Compare website content with target data and respond with exact JSON format.
  
  ADDRESS ANALYSIS:
  - isFound: true if ANY address appears on website, false if NO address found
  - isMatch: true if found address matches target address (same street, city, ZIP), false if different
  
  HOURS ANALYSIS:
  - isFound: true if ANY business hours appear on website, false if NO hours found  
  - isMatch: true if found hours match target hours (same days/times), false if different
  - Note: Target hours format: [{"openDay": "Monday", "openTime": {"hours": "9", "minutes": "0"}, "closeDay": "Monday", "closeTime": {"hours": "17", "minutes": "0"}}]
  - 24-hour format: closeTime has "hours": "24"
  
  PHONE ANALYSIS:
  - isFound: true if ANY phone number appears on website, false if NO phone found
  - isMatch: true if found phone matches target phone (same digits), false if different
  - Note: Ignore formatting differences like (555) 123-4567 vs 555-123-4567 vs 5551234567
  - Compare only the actual digits, ignoring spaces, dashes, parentheses, country codes
  
  MATCHING RULES:
  - Address: Consider variations like "St/Street", "Ave/Avenue", partial matches OK if core address same
  - Hours: Allow format differences (9 AM = 09:00 = 9:00), common variations OK
  - Phone: Strip all non-digit characters and compare digit sequences
  - Be flexible with minor formatting differences but strict on actual values
  
  REQUIRED JSON RESPONSE:
  {"address": {"isFound": boolean, "isMatch": boolean}, "hours": {"isFound": boolean, "isMatch": boolean}, "phone": {"isFound": boolean, "isMatch": boolean}, "error": null}
  
  If any errors occur, set "error" to brief description.
  
  WEBSITE TEXT:
  ${websiteText}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  });

  let content = response.choices[0].message.content;

  content = content.replace(/```json\s*([\s\S]*?)\s*```/, '$1').trim();

  try {
    const result = JSON.parse(content);
    
    if (!result.address || !result.hours || !result.phone) {
      throw new Error("Invalid response structure - missing required fields");
    }
    
    result.address.isFound = Boolean(result.address.isFound);
    result.address.isMatch = Boolean(result.address.isMatch);
    result.hours.isFound = Boolean(result.hours.isFound);
    result.hours.isMatch = Boolean(result.hours.isMatch);
    result.phone.isFound = Boolean(result.phone.isFound);
    result.phone.isMatch = Boolean(result.phone.isMatch);
    
    if (result.address.isMatch && !result.address.isFound) {
      result.address.isMatch = false;
    }
    if (result.hours.isMatch && !result.hours.isFound) {
      result.hours.isMatch = false;
    }
    if (result.phone.isMatch && !result.phone.isFound) {
      result.phone.isMatch = false;
    }
    
    console.log(`AI Analysis Result for ${location.business_name}:`, {
      address: result.address,
      hours: result.hours,
      phone: result.phone,
      error: result.error
    });
    
    // fallback validation for phone numbers
    if (targetPhone && result.phone.isFound && !result.phone.isMatch) {
      const normalizedTarget = normalizePhoneNumber(targetPhone);
      const phonePattern = new RegExp(normalizedTarget.split('').join('\\D*'), 'i');
      
      if (phonePattern.test(websiteText)) {
        console.log(`Fallback phone validation found match for ${location.business_name}`);
        result.phone.isMatch = true;
      }
    }
    
    return result;
  } catch (e) {
    console.error("Failed to parse GPT response:", content);
    return {
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
}
