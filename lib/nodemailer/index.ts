import nodemailer from "nodemailer";
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from "./templates";
import { getFormattedTodayDate } from "@/lib/utils";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
    },
});

export const sendWelcomeEmail = async ({email,name,intro}:WelcomeEmailData) => {

    const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name)
                                                .replace("{{intro}}", intro);

    const fromEmail = process.env.NODEMAILER_EMAIL || 'stockker@example.com';

    const mailOptions = {
        from : `"Stockker" <${fromEmail}>`,
        to : email,
        subject: "Welcome to Stockker!",
        text: 'Thanks for joining Stockker! You now have the tools to track markets and make informed investment decisions. We\'re excited to have you on board!',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async ({ email, name, newsContent }: NewsSummaryEmailData) => {
    const date = getFormattedTodayDate();

    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const fromEmail = process.env.NODEMAILER_EMAIL || 'stockker@example.com';

    const mailOptions = {
        from: `"Stockker" <${fromEmail}>`,
        to: email,
        subject: `Your Market News Summary – ${date}`,
        text: `Hi ${name}, here is your personalised market news summary for ${date}.`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
}

