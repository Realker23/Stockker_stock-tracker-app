import { inngest } from "./client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT, NEWS_SUMMARY_EMAIL_PROMPT } from "./prompts";
import { sendWelcomeEmail, sendNewsSummaryEmail } from "../nodemailer";
import { getAllUsersForNewsEmail } from "../actions/user.action";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getNews } from "../actions/finnhub.actions";

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

            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part) ? part.text : "Thanks for joining Stockker!. You now have the tools to track markets and make informed investment decisions. We're excited to have you on board!";
            
            // EMAIL SENDING LOGIC GOES HERE
            const {data: {email, name}} = event;
            
            
            return await sendWelcomeEmail({email, name, intro: introText})
            

        })

        return {
                success: true,
                message: "Welcome email sent successfully",
        }

    }
)

// Calculate 5 minutes from now
const now = new Date();
now.setMinutes(now.getMinutes() + 5);
const minute = now.getUTCMinutes();
const hour = now.getUTCHours();

export const sendDailyNewsSummary = inngest.createFunction(
    { id: 'daily-news-summary' },
    [
        { event: 'app/send.daily.news' },
        { cron: '0 12 * * *' }, // Every day at 12:00 PM UTC
    ],
    async ({ step }) => {

        // ── Step 1: Fetch every user that should receive a news email ────────
        const users = await step.run('get-all-users', getAllUsersForNewsEmail);

        if (!users || users.length === 0) {
            console.log('No users found for news email');
            return { success: false, message: 'No users to send news summary to' };
        }

        // ── Step 2: Resolve each user's watchlist and fetch personalised news ─
        type UserWithNews = {
            user: { id: string; email: string; name: string; country: string };
            news: MarketNewsArticle[];
        };

        const userNewsData = await step.run('fetch-user-news', async (): Promise<UserWithNews[]> => {
            const results: UserWithNews[] = [];

            for (const user of users) {
                // Get the symbols the user is watching (empty array = no watchlist)
                const symbols = await getWatchlistSymbolsByEmail(user.email);

                // Fetch symbol news; fall back to general market news when the
                // watchlist is empty or all symbol fetches return nothing
                let news: MarketNewsArticle[] = [];
                try {
                    news = await getNews(symbols.length > 0 ? symbols : undefined);
                } catch {
                    // Degrade gracefully – send email without news rather than
                    // blocking the entire batch
                    console.error(`Failed to fetch news for user [${user.id}]`);
                }

                results.push({ user, news });
            }

            return results;
        });

        // ── Step 3: Summarise each user's news via AI (placeholder) ──────────
        // TODO: call step.ai.infer with NEWS_SUMMARY_EMAIL_PROMPT for each user
        const userNewsSummaries: {user: User; newsContent: string|null}[] = await step.run('summarise-all-news', async () => {
            const summaries: {user: User; newsContent: string|null}[] = [];

            for(const {user, news} of userNewsData){
                summaries.push({user, newsContent: null});
            }

            return summaries;
        });

        // Run AI inference as individual steps per user
        const finalSummaries: {user: User; newsContent: string|null}[] = [];

        for(const {user, news} of userNewsData){
            try{
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace("{{newsData}}", JSON.stringify(news, null, 2));
                const response = await step.ai.infer(`summarise-news-for-${user.id}`,{
                    model: step.ai.models.gemini({model:'gemini-2.5-flash-lite'}),
                    body:{
                        contents:[
                            {
                                role:'user', parts:[{text: prompt}]
                            }
                        ]
                    }
                });
                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = ((part && 'text' in part) ? part.text : null) || "No Market News Available Today.";
                finalSummaries.push({user, newsContent});
            }catch(e){
                console.error(`Failed to summarise news for user [${user.id}]:`, e);
                finalSummaries.push({user, newsContent: null});
            }
        }

        // ── Step 4: Send the personalised email to each user ────────────────
        await step.run('send-news-emails', async () => {
            for (const { user, newsContent } of finalSummaries) {
                if (!newsContent) {
                    console.warn(`Skipping email for user [${user.id}] – no news content.`);
                    continue;
                }
                await sendNewsSummaryEmail({
                    email: user.email,
                    name: user.name,
                    newsContent,
                });
            }
        });

        return { success: true, message: 'Daily news summaries sent successfully' };
    }
);