import arcjet, { shield, detectBot, fixedWindow } from "@arcjet/next";

// Re-export as a singleton
export const aj = arcjet({
    key: process.env.ARCJET_KEY!, // Guest must add this to .env
    characteristics: ["ip.src"], // Track requests by IP address
    rules: [
        shield({ mode: "LIVE" }), // Protect against common attacks
        detectBot({
            mode: "LIVE",
            allow: ["CATEGORY:SEARCH_ENGINE"], // Allow search engines
        }),
        fixedWindow({
            mode: "LIVE",
            window: "1m", // 1 minute window
            max: 10, // Max 10 requests per minute
        }),
    ],
});
