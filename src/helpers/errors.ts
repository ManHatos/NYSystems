import { formatErrorMessage } from "./utility.js";

export const enum ErrorLevels {
	User = "USER",
	System = "SYSTEM",
	Fatal = "FATAL",
}

export class SystemError {
	/** error identifier */
	code: ErrorCodes;
	/** user-facing message shown to whoever caused the error */
	message: string;
	/** danger level indicator */
	level: ErrorLevels;
	/** log message used for debugging */
	cause: string;

	constructor(
		error: {
			code: ErrorCodes;
			message: string;
			level?: ErrorLevels;
			cause?: string;
		} = {
			code: ErrorCodes.UNKNOWN,
			message: "An unknown error has occured.\nPlease try again later.",
		}
	) {
		this.code = error.code;
		this.message = error.message;
		this.level = error.level || ErrorLevels.System;
		this.cause = error.cause || "Unknown cause";

		this.message = formatErrorMessage(this);
	}
}

export const enum ErrorCodes {
	// shared
	"UNKNOWN",
	"OUTDATED_REQUEST",
	"DUPLICATE_RESOURCE",

	// cachestore
	"CACHESTORE_UNKNOWN",

	// roblox user service
	"ROBLOX_USER_UNKNOWN",
	"ROBLOX_USER_TOO_SHORT",
	"ROBLOX_USER_TOO_LONG",
	"ROBLOX_USER_NOT_FOUND",
	"ROBLOX_USER_INVALID",
	"ROBLOX_USER_RATELIMIT",
	"ROBLOX_USER_EXTERNAL_ERROR",
}
