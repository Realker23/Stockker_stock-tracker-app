import { connectToDatabase } from "@/database/mongoose";

export const getAllUsersForNewsEmail = async () => {
    try{
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db){
            throw new Error("Database connection not established");
        }
        /**
         * Retrieves a list of users from the database with valid email addresses.
         *
         * @remarks
         * This query filters out users without an email address and only returns
         * the necessary fields required for email communication purposes.
         *
         * @returns {Promise<Array<{_id: ObjectId, id: string, email: string, name: string, country: string}>>}
         * A promise that resolves to an array of user objects containing:
         * - `_id` - The MongoDB ObjectId of the user
         * - `id` - The unique identifier of the user
         * - `email` - The email address of the user
         * - `name` - The full name of the user
         * - `country` - The country of the user
         *
         * @throws {MongoError} If there is an issue connecting to or querying the database
         *
         * @example
         * const users = await db.collection("user").find(...)
         * // users = [{ _id: ObjectId("..."), id: "123", email: "user@example.com", name: "John Doe", country: "US" }]
         */
        const users = await db.collection("user").find(
            {email: {$exists: true, $ne: null}}, // Only fetch users with a valid email
            {projection: {_id: 1, id:1, email: 1, name: 1, country:1}} // Only return necessary fields for sending emails
        ).toArray();

        return users.filter(user => user.email && user.name).map(user => ({id: user.id || user._id?.toString(), email: user.email, name: user.name, country: user.country}));

    }catch (error){
        console.error("Error fetching users for news email:", error);
        return []
    }
}