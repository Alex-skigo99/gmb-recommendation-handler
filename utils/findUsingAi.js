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

  const prompt = `You're an AI model. Analyze the following website text and determine if it contains the address "${fullAddress}" and the working hours.
   If yes, provide the isMatch as true. And return the address as it appears on the website in the format "address, city, state, zip".
   If the hours are found and match, return isMatch as true and the working hours in the format "Working hours on site".
    If the address is not found, return isMatch as false and matchedAddress as null.
    If the working hours are not found, return isMatch as false and matchedHours as null.
    The working hours format is [{ "openDay": "Monday", "openTime": {"hours": "9", "minutes": "0"}, "closeDay": "Monday", "closeTime": {"hours": "17", "minutes": "0"} }, ...].
   The working hours are: ${JSON.stringify(location.regular_hours.periods)}.
    Respond in JSON format like: {"address": {"isMatch": true/false, "error": "error message"},
   "hours": {"isMatch": true/false, "error": "error message"} }.
   Here is the website text: "${websiteText}"`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  });

  let content = response.choices[0].message.content;

  // Strip triple backticks if present
  content = content.replace(/```json\s*([\s\S]*?)\s*```/, '$1').trim();

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse GPT response:", content);
    return {
      isKeywordStuffed: null,
      notes: "Could not determine from GPT",
    };
  }
}
