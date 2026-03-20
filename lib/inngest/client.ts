import {Inngest} from "inngest";

export const inngest = new Inngest({
    id: "Stockker",
    ai: {
        gemini: {
            apiKey: process.env.GEMINI_API_KEY!,
        }
    }
});

/**
 * The ai property is not a valid option in the Inngest client constructor.
 * Looking at your code, you're trying to configure Gemini at the client level, but Inngest's AI features work differently. You need to:
 * Remove the ai config from the constructor
 * Use step.ai.infer() inside your function handlers with a model adapter
*/