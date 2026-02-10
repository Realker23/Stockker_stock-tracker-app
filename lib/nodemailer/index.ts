import nodemailer from "nodemailer";
import { WELCOME_EMAIL_TEMPLATE } from "./templates";

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


    const mailOptions = {
        from : '"Stockker" <stockker@example.com>',
        to : email,
        subject: "Welcome to Stockker!",
        text: 'Thanks for joining Stockker! You now have the tools to track markets and make informed investment decisions. We\'re excited to have you on board!',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}