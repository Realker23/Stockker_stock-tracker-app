import { success } from "better-auth";
import { inngest } from "./client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts";
import { sendWelcomeEmail } from "../nodemailer";

/**
 * Sends a sign-up email to a newly created user by handling the
 * 'app/user.created' event. The function extracts user profile information
 * from the event payload and formats it for inclusion in the email.
 *
 * @remarks
 * The payloads are provided via the `event.data` property, which is populated
 * when the 'app/user.created' event is emitted. This typically occurs in the
 * application's user registration flow, where user details such as country,
 * investment goals, risk tolerance, and preferred industry are included in
 * the event data.
 *
 * @param event - The event object containing user profile information in `event.data`.
 * @param step - The step object provided by Inngest for workflow orchestration.
 */
export const sendSignUpEmail = inngest.createFunction(
    {id: "sign-up-email"},
    {event: 'app/user.created'},
    async ({event,step}) => {
        /**
         * Generates a formatted string containing user profile information
         * extracted from the `event.data` object. The profile includes:
         * - Country
         * - Investment goals
         * - Risk tolerance
         * - Preferred industry
         *
         * @remarks
         * The `event` parameter is expected to have a `data` property
         * with the relevant fields. This is common in event-driven architectures
         * where event objects carry payloads in a `data` property.
         */
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace("{{userProfile}}", userProfile);
        

        /**
         * Calls the Inngest AI inference method to generate a personalized welcome email introduction based on the user's profile.
         *
         * The `step.ai.infer` method is used to invoke an AI model (in this case, Gemini 2.5 Flash Lite) with a structured prompt that includes the user's profile information. The response from the AI model is expected to contain a generated introduction that can be included in the welcome email.
         *
        Breaking Down Each Part
            1. step.ai.infer()
                This is Inngest's built-in AI inference method
                It allows you to call AI models as a step in your workflow (with automatic retries, logging, and error handling)
                The first argument 'generate-welcome-intro' is the step ID - a unique identifier for this particular AI call in your workflow
            2. model: step.ai.models.gemini({model:'gemini-2.5-flash-lite'})
                Specifies which AI model to use
                gemini-2.5-flash-lite is a lightweight, fast version of Google's Gemini 2.5 model
                The API key for Gemini was configured in your client.ts:5-7
            3. body.contents Array
                This follows the Gemini API message format
                It's an array of messages that represents the conversation history
        */

        const response = await step.ai.infer('generate-welcome-intro',{
            model: step.ai.models.gemini({model:'gemini-2.5-flash-lite'}),
            body:{
                contents:[
                    {
                        role:'user',
                        parts:[
                            {
                                text: prompt,
                            }
                        ]
                    }
                ]
            }
        })

        await step.run('send-welcome-email',async ()=>{
            // Here you would integrate with your email service provider (like SendGrid, Mailgun, etc.) to send the email
            // using the generated response from the AI as the email content
            console.log("Email content:", response.candidates?.[0]?.content?.parts?.[0]);
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part) ? part.text : "Thanks for joining Stockker!. You now have the tools to track markets and make informed investment decisions. We're excited to have you on board!";
            
            // EMAIL SENDING LOGIC GOES HERE
            const {data: {email, name}} = event;
            
            console.log("Sending email to:", email, "Name:", name);
            
            return await sendWelcomeEmail({email, name, intro: introText})
            

        })

        return {
                success: true,
                message: "Welcome email sent successfully",
        }

    }
)