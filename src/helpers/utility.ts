import "dotenv/config";
import { cachestore } from "../services/cachestore.js";
import { ErrorCodes, ErrorLevels, SystemError } from "./errors.js";
import { Camelize, DiscordEmbed } from "@discordeno/bot";

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

/** extract the user identifier (ID) from a `SENTINEL_USER_SEARCH` autocomplete option */
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

/** construct a Discord embed using system-wide default configurations */
export const Embeds = (
	/** an array of discord camelized embed objects that will be converted into the default systems embed format */
	embeds: Pick<
		Embed,
		"author" | "description" | "fields" | "footer" | "thumbnail" | "url" | "title"
	>[],
	/** override the default embed generator format */
	override?: Pick<Embed, "color" | "image" | "timestamp">
): Embed[] => {
	return embeds.map((input) => {
		let embed: Embed = input;
		embed.color = override?.color ?? Number(process.env.SENTINEL_EMBED_COLOR_PRIMARY);
		embed.image = override?.image ?? {
			url: process.env.URI_EMBED_WIDTH_LIMITER,
		};
		embed.timestamp = override?.timestamp ?? new Date().toISOString();

		return embed;
	});
};

type Embed = Camelize<DiscordEmbed>;

// unqiue values to validate stringify utilities
const isBigInt = "_%T=BIGINT";
const stringifyIdentifier = "__%G=STRINGIFY";

/** `JSON.stringify` with proper `BigInt` handling */
export const stringify = (data: any): string | undefined => {
	if (data !== undefined) {
		return (
			stringifyIdentifier +
			JSON.stringify(data, (_, value) => {
				return typeof value === "bigint" ? { [isBigInt]: true, value: value.toString() } : value;
			})
		);
	}
};

/** check whether `data` is a valid `stringify` answer */
export const validateStringify = (data: string): boolean => {
	return data.startsWith(stringifyIdentifier);
};

/** `JSON.parse` with proper `BigInt` handling (`data` must be a valid `stringify` answer to validate `BigInt`s) */
export const unstringify = (data?: string) => {
	if (data !== undefined) {
		if (!validateStringify(data))
			throw new SystemError({
				code: ErrorCodes.INVALID,
				message: "Value passed to `unstringify` is not valid.",
				cause: "`unstringify` validation check failed",
				level: ErrorLevels.System,
			});
		return JSON.parse(data.replace(stringifyIdentifier, ""), (_, value) => {
			return typeof value === "object" &&
				value &&
				Object.keys(value).every((key) => [isBigInt, "value"].includes(key)) &&
				value[isBigInt] &&
				typeof value.value == "string"
				? BigInt(value.value)
				: value;
		});
	}
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
	{
		[K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
	}[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
	{
		[K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
	}[Keys];
