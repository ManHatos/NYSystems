import "dotenv/config";
import { cachestore } from "../services/cachestore.js";
import { ErrorCodes, ErrorLevels, SystemError } from "./errors.js";

/** pauses the process for the specified `delay` in milliseconds */
export const wait = async (delay: number): Promise<void> => {
	return new Promise((resolve) => {
		setTimeout(() => resolve(), delay);
	});
};

/** reduce multiple requests made within `delay` across different child processes, resolves if `value` (a string used to identify the request) was associated with the latest request, rejects if `value` was updated (as a result of another request) */
export const throttle = async (
	group: [string, ...string[]],
	value: string,
	delay: number
): Promise<void> => {
	return new Promise(async (resolve, reject) => {
		try {
			group.push("throttle");
			const cachePath = group.join("/");

			await cachestore.set(cachePath, value, {
				expiry: Math.round(delay / 1000) + 10,
			});
			await wait(delay);

			const cacheLatest = await cachestore.get(cachePath);

			if (typeof cacheLatest == "string" && cacheLatest == value) return resolve();
			else
				throw new SystemError({
					code: ErrorCodes.OUTDATED_REQUEST,
					message: "This request is currently outdated.\nPlease try again later.",
					level: ErrorLevels.System,
					cause: "Throttle utility outdated",
				});
		} catch (error) {
			reject(error);
		}
	});
};

/** replace all characters in a string after provided `limit` (with index 1), optionally replaces the excess with a string (default `...`) */
export const limitString = (string: string, limit: number, replaceWith: string = "...") => {
	return string.replace(RegExp(`(?<=.{${limit}}).+`), replaceWith);
};

/** extract the creation date from a Discord user identifiers (ID) */
export const dateFromSnowflake = (snowflake: bigint, epoch = 1420070400000n): Date => {
	return new Date(Number((snowflake >> 22n) + epoch));
};

/** turn a number of days into a date, `n > 0` = past, `n < 0` for the future */
export const dateFromDays = (
	days: number,
	options?: {
		pastOnly: boolean;
	}
): Date => {
	const ms = (options?.pastOnly ? Math.abs(days) : days) * 24 * 60 * 60 * 1000;
	return new Date(Date.now() - ms);
};

/** extract the user identifier (ID) from a `MODERATION_USER` autocomplete option */
export const extractUserAutocompleteID = (value: string): number => {
	return value.startsWith(process.env.SENTINEL_USER_AUTOCOMPLETE_PREFIX) || value.startsWith("#")
		? Number(value.replace(process.env.SENTINEL_USER_AUTOCOMPLETE_PREFIX, "").replace("#", ""))
		: NaN;
};

/** format a user-facing error message */
export const formatErrorMessage = (error: SystemError): string => {
	const emoji =
		error.level == ErrorLevels.User ? process.env.EMOJI_ERROR_USER : process.env.EMOJI_ERROR_SYSTEM;
	const segments = error.message.split("\n");

	return emoji + " **" + segments.shift() + "**" + (segments ? "\n" + segments.join("\n") : "");
};
