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
   If the any address is found return isFound as true. If the address is found and matches the provided address, return isMatch as true.
   If the no address is found, return isFound as false and isMatch as false.
   If the any working hours are found return isFound as true. If the hours are found and match the provided hours, return isMatch as true.
  If the no working hours are found, return isFound as false and isMatch as false.
  The working hours format is [{ "openDay": "Monday", "openTime": {"hours": "9", "minutes": "0"}, "closeDay": "Monday", "closeTime": {"hours": "17", "minutes": "0"} }, ...].
  For 24 working hours, use {"openDay": "day of the week", "openTime": {}, "closeDay": "day of the week", "closeTime": {"hours": "24"} }.
   The working hours are: ${JSON.stringify(location.regular_hours.periods)}.
    Respond in JSON format like: {"address": {"isFound": true/false, "isMatch": true/false}, "hours": {"isFound": true/false, "isMatch": true/false}, "error": "error message" }.
   Here is the website text: "${websiteText}"`;

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
