/**
 * The `mongodbAdapter` function is used to integrate MongoDB as the storage backend for authentication data.
 * It provides an adapter interface that allows the `betterAuth` library to store and retrieve user credentials,
 * sessions, and other authentication-related information directly from a MongoDB database.
 *
 * By passing the MongoDB database instance to `mongodbAdapter`, authentication operations such as user sign-up,
 * sign-in, session management, and password handling are persisted in MongoDB collections, ensuring scalability
 * and reliability for applications requiring robust data storage.
 *
 * @param db - The MongoDB database instance to be used for storing authentication data.
 * @returns An adapter object compatible with `betterAuth` for MongoDB operations.
 */
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";


//singleton for auth - creating single instance
let authInstance: ReturnType<typeof betterAuth> | null = null;


/**
 * Retrieves or initializes the authentication instance for the application.
 *
 * This function checks if an authentication instance (`authInstance`) already exists.
 * If it does, it returns the existing instance. Otherwise, it establishes a connection
 * to the MongoDB database, verifies the connection, and creates a new authentication
 * instance using the `betterAuth` library with the provided configuration options.
 *
 * The authentication setup includes:
 * - MongoDB adapter for storing authentication data.
 * - Secret and base URL from environment variables.
 * - Email and password authentication with configurable options (sign-up, password length, auto sign-in).
 * - Cookie management plugin for Next.js.
 * - Debug mode enabled in non-production environments.
 *
 * @returns {Promise<AuthInstance>} The initialized authentication instance.
 * @throws {Error} If the database connection is not established.
 */

export const getAuth = async() => {
    if(authInstance) {
        return authInstance;
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if(!db) throw new Error("Database connection is not established");

    authInstance = betterAuth({
        database: mongodbAdapter(db),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        emailAndPassword:{
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        plugins: [nextCookies()],
        debug: process.env.NODE_ENV !== "production",
        
    });

    return authInstance;

}




export const auth = {
    api: {
        signUpEmail: async (opts: any) => (await getAuth()).api.signUpEmail(opts),
        signInEmail: async (opts: any) => (await getAuth()).api.signInEmail(opts),
        signOut: async (opts: any) => (await getAuth()).api.signOut(opts),
        getSession: async (opts: any) => (await getAuth()).api.getSession(opts),
    }
} as unknown as Awaited<ReturnType<typeof getAuth>>;