import "dotenv/config";
import { SystemError, ErrorCodes, ErrorLevels } from "../helpers/errors.js";
import { cachestore } from "./cachestore.js";

/** contact the bloxlink APIs */
export const bloxlink = {
	/** retrieve information about a user's linked account(s) */
	linked: {
		/** return linked Discord accounts from a Roblox identifier */
		roblox: async function (id: number): Promise<LinkedBloxlinkDiscordAccounts> {
			return new Promise(async (resolve, reject) => {
				try {
					await request(`/roblox-to-discord/${id}`, "GET").then(async (response) => {
						resolve({
							ids: (await handleResponse(response)).discordIDs?.map((id: string) => BigInt(id)),
						});
					});
				} catch (error) {
					reject(error);
				}
			});
		},
		/** return a linked Roblox account from a Discord identifier */
		discord: async function (id: bigint): Promise<LinkedBloxlinkRobloxAccount> {
			return new Promise(async (resolve, reject) => {
				try {
					await request(`/discord-to-roblox/${id}`, "GET").then(async (response) => {
						resolve({
							id: Number((await handleResponse(response)).robloxID),
						});
					});
				} catch (error) {
					reject(error);
				}
			});
		},
	},
};

/** bloxlink's API hostname */
const hostname = "api.blox.link";

/** send authenticated requests to Bloxlink APIs */
async function request(
	path: string,
	method: HTTPMethods,
	options: HTTPOptions = {}
): Promise<Response> {
	const request: Record<string, any> = {
		method,
		headers: {
			Authorization: `${process.env.BLOXLINK_KEY}`,
		},
	};
	const endpoint =
		"https://" + hostname + `/v${"4"}/public/guilds/${process.env.DISCORD_GUILD}` + path;

	if (options.body) request.body = JSON.stringify(options.body);

	const cachedEndpoint = (await cachestore.get(csKey(endpoint)).catch((error) => {
		if (error instanceof SystemError && error.code == ErrorCodes.CACHESTORE_INVALID_RESPONSE)
			return;
		else throw error;
	})) as BloxlinkCachedResponseData | undefined;
	if (!cachedEndpoint)
		return fetch(
			options.params ? endpoint.concat("?" + new URLSearchParams(options.params)) : endpoint,
			request
		);
	else
		return new Response(JSON.stringify(cachedEndpoint.body), {
			status: cachedEndpoint.status,
			statusText: cachedEndpoint.statusText,
			headers: new Headers([["bloxlinkCachedRequest", "true"]]),
		});
}

/** handle an endpoint's response */
async function handleResponse(response: Response, body?: any) {
	body = body ?? (await response.json());

	if (!response.headers.has("bloxlinkCachedRequest"))
		await cachestore.set(
			csKey(response.url),
			{
				status: response.status,
				statusText: response.statusText,
				body,
			} as BloxlinkCachedResponseData,
			{
				expiry: 60 * 60,
			}
		);

	if (response.ok) return body;
	else if (response.status == 404) {
		throw new SystemError({
			message:
				"The system was unable to find a linked Bloxlink account.\nPlease proceed using Nexus.",
			code: ErrorCodes.BLOXLINK_NOT_FOUND,
			level: ErrorLevels.System,
			cause: "Bloxlink API returned not found",
		});
	} else if (response.status == 429)
		throw new SystemError({
			code: ErrorCodes.BLOXLINK_RATELIMIT,
			message: "The system has been temporarily blocked by Bloxlink.\nPlease try again later.",
			level: ErrorLevels.System,
			cause: "Bloxlink API rate limited",
		});
	else if (response.status >= 500)
		throw new SystemError({
			code: ErrorCodes.BLOXLINK_EXTERNAL_ERROR,
			message: "The Bloxlink service is currently unavailable.\nPlease try again later.",
			level: ErrorLevels.System,
			cause: "Bloxlink API returned server error",
		});
	else
		throw new SystemError({
			...defaultMessage(),
			code: ErrorCodes.BLOXLINK_UNKNOWN,
			level: ErrorLevels.System,
			cause: "Roblox API returned unhandled status " + response.status,
		});
}

function defaultMessage(): Pick<SystemError, "message"> {
	return {
		message: "The Bloxlink service has encountered an error.\nPlease try again later.",
	};
}

// TODO: helpers for generating consistent cachestore keys
// temporary function
function csKey(r: string): string {
	return "cached/bloxlinkServiceResponses/url;" + r;
}

// typings

type HTTPMethods = "GET" | "POST";

type HTTPOptions = {
	body?: Record<string, any>;
	params?: Record<string, any>;
};

type BloxlinkCachedResponseData = {
	status: Response["status"];
	statusText: Response["statusText"];
	body: Response["body"];
};

export type LinkedBloxlinkDiscordAccounts = {
	ids: bigint[];
	resolved?: {};
};

export type LinkedBloxlinkRobloxAccount = {
	id: number;
	resolved?: {};
};
