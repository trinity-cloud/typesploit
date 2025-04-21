/**
 * Base error class for typesploit specific errors.
 */
export class TypesploitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name; // Set name to the specific error class
        // Maintain stack trace (useful for V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Error during RPC connection or communication.
 */
export class MsfRpcError extends TypesploitError {}

/**
 * Authentication failed error.
 */
export class MsfAuthError extends TypesploitError {}

/**
 * Operation timed out error.
 */
export class MsfTimeoutError extends TypesploitError {}

/**
 * Value error (e.g., invalid option value).
 */
export class ValueError extends TypesploitError {}

/**
 * Resource not found error (e.g., session, module, console).
 */
export class NotFoundError extends TypesploitError {} 