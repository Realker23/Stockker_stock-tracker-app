'use server';

import { headers } from "next/headers";
import { auth } from "../better-auth/auth";
import { inngest } from "../inngest/client";

/**
         * Sends a sign-up request to the authentication API and stores the awaited response.
         *
         * The `body` property is the predefined request payload shape required by
         * `auth.api.signUpEmail`, containing the user's `email`, `password`, and `name`,
         * all mapped from the corresponding fields on `formData`.
         * @remarks
         * The `signUpEmail` function is expected to exist on the `auth.api` object of
         * the initialized `auth` instance. Ensure that `auth` and `auth.api` are
         * properly configured before invoking this method.
         *
         *
         * @returns The response from `auth.api.signUpEmail`, which typically includes
         *          user data or error information from the sign-up operation.
         */
/**
 * Sends a sign-up request through the `auth.api.signUpEmail` method.
 *
 * This call forwards the user's email, password, and full name to the
 * authentication backend and awaits the resulting response, which may include
 * user data, session information, or error details.
 *
 * @returns A promise that resolves with the authentication service's response
 * to the email sign-up request.
 */
export const signUpWithEmail = async (formData: SignUpFormData) => {
    // Here you would typically send the formData to your backend API to create a new user
    let response;
    
    try{
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

    // Send event to Inngest in a separate try/catch so failures don't affect signup success
    if(response){
        try{
            await inngest.send({
                name: "app/user.created",
                data: {
                    email: formData.email,        // ← Must include this
                    name: formData.fullName,      // ← Must include this
                    country: formData.country,
                    investmentGoals: formData.investmentGoals,
                    riskTolerance: formData.riskTolerance,
                    preferredIndustry: formData.preferredIndustry,
                }
            })
        }catch(eventError){
            console.error("Failed to send user.created event to Inngest:", eventError);
            // Continue - don't fail the signup if event dispatch fails
        }
    }

    return {success: true, message: "User signed up successfully", data: response}

}

export const signOut = async () => {
    try{
        await auth.api.signOut({headers: await headers()});
    }catch(error){
        console.error("Error signing out:", error);
        return {success: false, message: "Sign-out failed"};
    }

}


/**
 * Authenticates a user by signing them in with email and password credentials.
 *
 * @param formData - The sign-in form data containing user credentials
 * @param formData.email - The user's email address
 * @param formData.password - The user's password
 *
 * @returns A promise that resolves to an object containing:
 *          - `success`: A boolean indicating whether the sign-in was successful
 *          - `message`: A descriptive message about the operation result
 *          - `data`: The authentication response data on success, or null on failure
 *
 * @throws Does not throw errors directly; catches and returns error state in the response object
 *
 * @example
 * ```typescript
 * const result = await signInWithEmail({
 *   email: "user@example.com",
 *   password: "securePassword123"
 * });
 *
 * if (result.success) {
 *   console.log("Sign-in successful:", result.data);
 * } else {
 *   console.error("Sign-in failed:", result.message);
 * }
 * ```
 */
export const signInWithEmail = async (formData: SignInFormData) => {
    // Here you would typically send the formData to your backend API to create a new user
    try{
        
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