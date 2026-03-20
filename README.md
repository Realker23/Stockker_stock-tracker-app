This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Daily Summary News Feature

Step 1 - retrieve all the users to receive news at specific time 12 utc
Step 2 - Check the users watchlist and send the news specific to there watchlist 
Step 3 - News more digestable through AI 
Step 4 - will use NodeMailer function


## watchlist prompt 
We need to set up a watchlist system for our app. Here’s what you should build:

1. Watchlist model (/database/models/watchlist.model.ts)

* Create a Mongoose schema for a Watchlist collection.
* Fields:

* userId (string, required, indexed)
* symbol (string, required, uppercase, trimmed)
* company (string, required, trimmed)
* addedAt (date, default: now)
* Add a compound index on userId + symbol so a user can’t add the same stock twice.
* Export an interface WatchlistItem extends Document with those fields.
* Use the models?.Watchlist || model pattern to avoid hot-reload issues.

2. Watchlist actions (/lib/actions/watchlist.actions.ts)

* Add "use server".
* Write a function getWatchlistSymbolsByEmail(email: string): Promise<string[]>.
* It should:

* Connect to the database.
* Find the user by email in the user collection (Better Auth).
* If no user, return an empty array.
* If found, query the Watchlist by userId, return just the symbols as strings.
* Catch errors, log them, return an empty array.

3. Finnhub actions (/lib/actions/finnhub.actions.ts)

* Add "use server".
* Define constants for FINNHUB_BASE_URL and NEXT_PUBLIC_FINNHUB_API_KEY.
* Write fetchJSON(url, revalidateSeconds?):

* If revalidateSeconds is passed, use cache: force-cache with next.revalidate.
* Otherwise use cache: no-store.
* Throw on non-200 responses.
* Write getNews(symbols?: string[]):

* Compute date range for last 5 days.
* If symbols exist:

* Clean and uppercase them.
* Loop max 6 times, round-robin through symbols.
* Fetch company news for each symbol.
* Take one valid article per round.
* Collect, sort by datetime, return.
* If no symbols:

* Fetch general market news.
* Deduplicate by id/url/headline.
* Take top 6, format them.
* Always validate articles before formatting.
* Catch errors, log, throw Failed to fetch news.

4. Inngest functions (/lib/inngest/functions.ts)

* Keep the existing sendSignUpEmail (already uses AI for personalized intro).
* Add sendDailyNewsSummary:

* Triggered by cron at 12 PM UTC daily, and event app/send.daily.news.
* Step 1: get all users (getAllUsersForNewsEmail).
* Step 2: For each user, get their watchlist symbols → fetch news (or general if none).
* Step 3: (placeholder) Summarize news via AI.
* Step 4: (placeholder) Send the emails.
* Return { success: true } at the end.

Key rules:

* Use the functions from /lib/utils.ts file when needed.
* Always fail gracefully: if user not found or no news, return an empty array.
* Max 6 articles per user.
* Round-robin for symbol news, fallback to general if empty.
* Strong typing everywhere, no any.