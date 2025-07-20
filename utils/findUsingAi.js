import { OpenAI } from "openai";
import { buildFullAddress } from "./buildFullAddress.js";
import dotenv from "dotenv"; // remove

dotenv.config(); // remove

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function findUsingAi(location, websiteText) {
  const fullAddress = buildFullAddress(location);
  console.log(`Finding address using AI for: ${fullAddress}`);

  const prompt = `Analyze this website text to find address and business hours information.

  TARGET ADDRESS: "${fullAddress}"
  TARGET HOURS: ${JSON.stringify(location.regular_hours?.periods || [])}
  
  TASK: Compare website content with target data and respond with exact JSON format.
  
  ADDRESS ANALYSIS:
  - isFound: true if ANY address appears on website, false if NO address found
  - isMatch: true if found address matches target address (same street, city, ZIP), false if different
  
  HOURS ANALYSIS:
  - isFound: true if ANY business hours appear on website, false if NO hours found  
  - isMatch: true if found hours match target hours (same days/times), false if different
  - Note: Target hours format: [{"openDay": "Monday", "openTime": {"hours": "9", "minutes": "0"}, "closeDay": "Monday", "closeTime": {"hours": "17", "minutes": "0"}}]
  - 24-hour format: closeTime has "hours": "24"
  
  MATCHING RULES:
  - Address: Consider variations like "St/Street", "Ave/Avenue", partial matches OK if core address same
  - Hours: Allow format differences (9 AM = 09:00 = 9:00), common variations OK
  - Be flexible with minor formatting differences but strict on actual values
  
  REQUIRED JSON RESPONSE:
  {"address": {"isFound": boolean, "isMatch": boolean}, "hours": {"isFound": boolean, "isMatch": boolean}, "error": null}
  
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
    return JSON.parse(content);
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
      error: "Failed to parse GPT response",
    };
  }
}
