'use server';

import { headers } from "next/headers";
import { getAuth } from "../better-auth/auth";
import { inngest } from "../inngest/client";

export const signUpWithEmail = async (formData: SignUpFormData) => {
    let response;
    try{
        const auth = await getAuth();
        response = await auth.api.signUpEmail({
            body:{
                email: formData.email,
                password: formData.password,
                name: formData.fullName,
            }
        })
    }catch(error){
         return {success: false, message: "User sign-up failed", data: null}
    }

    if(response){
        try{
            await inngest.send({
                name: "app/user.created",
                data: {
                    email: formData.email,
                    name: formData.fullName,
                    country: formData.country,
                    investmentGoals: formData.investmentGoals,
                    riskTolerance: formData.riskTolerance,
                    preferredIndustry: formData.preferredIndustry,
                }
            })
        }catch(eventError){
            console.error("Failed to send user.created event to Inngest:", eventError);
        }
    }

    return {success: true, message: "User signed up successfully", data: response}
}

export const signOut = async () => {
    try{
        const auth = await getAuth();
        await auth.api.signOut({headers: await headers()});
    }catch(error){
        console.error("Error signing out:", error);
        return {success: false, message: "Sign-out failed"};
    }
}

export const signInWithEmail = async (formData: SignInFormData) => {
    try{
        const auth = await getAuth();
        const response = await auth.api.signInEmail({
            body:{
                email: formData.email,
                password: formData.password,
            }
        })
        return {success: true, message: "User signed in successfully", data: response}
    }catch(error){
         return {success: false, message: "User sign-in failed", data: null}
    }
}