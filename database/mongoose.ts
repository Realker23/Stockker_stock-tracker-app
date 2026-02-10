import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';


/**
 * Declares a global variable `mongooseCache` to cache the Mongoose connection and its promise.
 * This is useful for maintaining a single database connection instance across multiple module reloads,
 * especially in serverless or development environments where hot-reloading may occur.
 *
 * @property conn - The active Mongoose connection instance or `null` if not connected.
 * @property promise - A promise resolving to a Mongoose connection or `null` if not initiated.
 *
 * The `declare global` syntax extends the global scope with custom types or variables,
 * allowing them to be accessed throughout the application.
 */

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    };
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}


export const connectToDatabase = async () => {
    if(!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env');
    }
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {bufferCommands: false})

    }

    try {
        cached.conn = await cached.promise;
    }catch (error) {
        cached.promise = null;
        throw error;
    }

    return cached.conn;

}



