import "dotenv/config";
import { request as roblox } from "../roblox.js";
import { ErrorCodes, ErrorLevels, SystemError } from "../../helpers/errors.js";

export const users = {
	/** return detailed information about a roblox user using their unique identifier or username (more requests) */
	single: async function (query: string | number): Promise<UsersSingle> {
		return new Promise(async (resolve, reject) => {
			try {
				let id: number = Number(query);
				if (typeof query == "string") {
					if (query.length < 3)
						throw new SystemError({
							code: ErrorCodes.ROBLOX_USER_TOO_SHORT,
							message: `The username \` ${query} \` is too short.`,
							level: ErrorLevels.User,
							cause: "Username shorter than 3 characters: " + query,
						});

					if (!query.match(/^(?=^[^_\n]+_?[^_\n]+$)\w{3,}$/gm))
						throw new SystemError({
							code: ErrorCodes.ROBLOX_USER_INVALID,
							message: `The username \` ${query} \` is invalid.`,
							level: ErrorLevels.User,
							cause: "RegEx match failed",
						});

					await this.multiple([query]).then((users) => {
						if (users[0]) id = users[0].id;
						else
							throw new SystemError({
								code: ErrorCodes.ROBLOX_USER_NOT_FOUND,
								message: `The username \` ${query} \` cannot be found.`,
								level: ErrorLevels.User,
								cause: "Roblox API multi-user `GET` failed: " + query,
							});
					});
				}

				if (!isFinite(id) || id == 0)
					throw new SystemError({
						code: ErrorCodes.ROBLOX_USER_INVALID,
						message: `The user identifier (ID) \` ${id} \` is invalid.`,
						level: ErrorLevels.System,
						cause: "Identifier is either `0` or `NaN`: " + id,
					});

				await roblox.users("GET", "/users/" + id).then(async (response) => {
					if (response.status == 404)
						throw new SystemError({
							code: ErrorCodes.ROBLOX_USER_NOT_FOUND,
							message: `The user identifier (ID) \` ${id} \` cannot be found.`,
							level: ErrorLevels.User,
							cause: "Roblox API user `GET` returned `Not Found`",
						});
					else resolve(await handleResponse(response));
				});
			} catch (error) {
				reject(error);
			}
		});
	},

	/** return basic information about multiple roblox users using their usernames or identifiers */
	multiple: async function (
		query: [string, ...string[]] | [number, ...number[]],
		options?: {
			excludeBanned?: boolean;
		}
	): Promise<UsersMulti[]> {
		return new Promise(async (resolve, reject) => {
			try {
				if (query.length < 1)
					throw new SystemError({
						...defaultMessage(),
						code: ErrorCodes.ROBLOX_USER_TOO_SHORT,
						level: ErrorLevels.System,
						cause: "Array passed has no elements",
					});
				if (query.every((item) => typeof item == "string")) {
					await roblox
						.users("POST", "/usernames/users", {
							body: {
								usernames: query,
								excludeBannedUsers: options?.excludeBanned ?? false,
							},
						})
						.then(async (response) => {
							if (response.status == 400)
								throw new SystemError({
									...defaultMessage(),
									code: ErrorCodes.ROBLOX_USER_TOO_LONG,
									level: ErrorLevels.System,
									cause: "Array passed has too many elements",
								});
							else resolve((await handleResponse(response)).data);
						});
				} else if (query.every((item) => typeof item == "number")) {
					await roblox
						.users("POST", "/users", {
							body: {
								userIds: query,
								excludeBannedUsers: options?.excludeBanned ?? false,
							},
						})
						.then(async (response) => {
							if (response.status == 400)
								throw new SystemError({
									...defaultMessage(),
									code: ErrorCodes.ROBLOX_USER_TOO_LONG,
									level: ErrorLevels.System,
									cause: "Array passed has too many elements",
								});
							else resolve(await handleResponse(response));
						});
				} else
					throw new SystemError({
						...defaultError(),
						level: ErrorLevels.Fatal,
						cause: "Array elements failed type check",
					});
			} catch (error) {
				reject(error);
			}
		});
	},

	/** search for a roblox user using their username, currently no support for pagination */
	search: async function (
		query: string,
		options?: {
			limit?: number;
			start?: number;
		}
	): Promise<UsersSearch[]> {
		return new Promise(async (resolve, reject) => {
			try {
				if (query.length < 3)
					throw new SystemError({
						code: ErrorCodes.ROBLOX_USER_TOO_SHORT,
						message: `The username \` ${query} \` is too short.`,
						level: ErrorLevels.User,
						cause: "Query is shorter than 3 characters",
					});
				await roblox
					.core("GET", "/search/users/results", {
						params: {
							keyword: query,
							maxRows: options?.limit ?? 10,
						},
					})
					.then(async (response) => {
						const body = await response.json();
						if (response.ok && !body?.UserSearchResults)
							throw new SystemError({
								code: ErrorCodes.ROBLOX_USER_NOT_FOUND,
								message: `The username \` ${query} \` was either not found or was filtered.`,
								level: ErrorLevels.User,
								cause: "`response.UserSearchResults` was undefined",
							});
						else
							resolve(
								(await handleResponse(response, body))?.UserSearchResults.map((user: any) => {
									return {
										id: user.UserId,
										name: user.Name,
										displayName: user.DisplayName,
										description: user.Blurb,
										profilePath: user.UserProfilePageUrl,
										online: user.IsOnline,
										hasVerifiedBadge: user.HasVerifiedBadge,
									};
								}) ?? []
							);
					});
			} catch (error) {
				reject(error);
			}
		});
	},

	/** retrieve different user avatar types */
	avatars: {
		/** return full avatars of multiple users using their identifiers */
		full: async function (
			query: [number, ...number[]],
			options?: {
				size?:
					| "30x30"
					| "48x48"
					| "60x60"
					| "75x75"
					| "100x100"
					| "110x110"
					| "140x140"
					| "150x150"
					| "150x200"
					| "180x180"
					| "250x250"
					| "352x352"
					| "420x420"
					| "720x720";
				format?: UsersAvatarFormats;
				circular?: boolean;
			}
		): Promise<UsersAvatar[]> {
			return new Promise(async (resolve, reject) => {
				try {
					await roblox
						.thumbnails("GET", "/users/avatar", {
							params: {
								userIds: String(query),
								size: options?.size ?? "420x420",
								format: options?.format ?? "Png",
								isCircular: String(options?.circular ?? false),
							},
						})
						.then(async (response) => {
							const body = await response.json();
							if (response.status == 400 && body.errors[0])
								throw new SystemError({
									...defaultMessage(),
									code: ErrorCodes.ROBLOX_USER_INVALID,
									level: ErrorLevels.System,
									cause: body.errors[0]?.message ?? "Unknown error",
								});
							else resolve((await handleResponse(response, body)).data);
						});
				} catch (error) {
					reject(error);
				}
			});
		},

		/** return avatar busts (from chest and above) of multiple users using their identifiers */
		bust: async function (
			query: [number, ...number[]],
			options?: {
				size?:
					| "48x48"
					| "50x50"
					| "60x60"
					| "75x75"
					| "100x100"
					| "150x150"
					| "180x180"
					| "352x352"
					| "420x420";
				format: UsersAvatarFormats;
				circular?: boolean;
			}
		): Promise<UsersAvatar[]> {
			return new Promise(async (resolve, reject) => {
				try {
					await roblox
						.thumbnails("GET", "/users/avatar-bust", {
							params: {
								userIds: String(query),
								size: options?.size ?? "420x420",
								format: options?.format ?? "Png",
								isCircular: String(options?.circular ?? false),
							},
						})
						.then(async (response) => {
							const body = await response.json();
							if (response.status == 400 && body.errors[0])
								throw new SystemError({
									...defaultMessage(),
									code: ErrorCodes.ROBLOX_USER_INVALID,
									level: ErrorLevels.System,
									cause: body.errors[0]?.message ?? "Unknown error",
								});
							else resolve((await handleResponse(response, body)).data);
						});
				} catch (error) {
					reject(error);
				}
			});
		},

		/** return avatar headshots of multiple users using their identifiers */
		headshot: async function (
			query: [number, ...number[]],
			options?: {
				size?:
					| "48x48"
					| "50x50"
					| "60x60"
					| "75x75"
					| "100x100"
					| "110x110"
					| "150x150"
					| "180x180"
					| "352x352"
					| "420x420"
					| "720x720";
				format: UsersAvatarFormats;
				circular?: boolean;
			}
		): Promise<UsersAvatar[]> {
			return new Promise(async (resolve, reject) => {
				try {
					await roblox
						.thumbnails("GET", "/users/avatar-headshot", {
							params: {
								userIds: String(query),
								size: options?.size ?? "420x420",
								format: options?.format ?? "Png",
								isCircular: String(options?.circular ?? false),
							},
						})
						.then(async (response) => {
							const body = await response.json();
							if (response.status == 400 && body.errors[0])
								throw new SystemError({
									...defaultMessage(),
									code: ErrorCodes.ROBLOX_USER_INVALID,
									level: ErrorLevels.System,
									cause: body.errors[0]?.message ?? "Unknown error",
								});
							else resolve((await handleResponse(response, body)).data);
						});
				} catch (error) {
					reject(error);
				}
			});
		},
	},
};

// handlers

async function handleResponse(response: Response, body?: any) {
	body = body ?? (await response.json());
	if (response.ok) return body;
	else if (response.status == 429)
		throw new SystemError({
			code: ErrorCodes.ROBLOX_USER_RATELIMIT,
			message: "The system has been temporarily blocked by Roblox.\nPlease try again later.",
			level: ErrorLevels.System,
			cause: "Roblox API rate limited",
		});
	else if (response.status >= 500)
		throw new SystemError({
			code: ErrorCodes.ROBLOX_USER_EXTERNAL_ERROR,
			message: "The Roblox service is currently unavailable.\nPlease try again later.",
			level: ErrorLevels.System,
			cause: "Roblox API returned server error",
		});
	else
		throw new SystemError({
			...defaultError(),
			level: ErrorLevels.System,
			cause: "Roblox API returned unhandled status",
		});
}

function defaultError(): Pick<SystemError, "code" | "message"> {
	return {
		code: ErrorCodes.ROBLOX_USER_UNKNOWN,
		...defaultMessage(),
	};
}
function defaultMessage(): Pick<SystemError, "message"> {
	return {
		message: "The Roblox service has encountered an error.\nPlease try again later.",
	};
}

// typings

export type UsersSingle = {
	description: string;
	created: string;
	isBanned: boolean;
	externalAppDisplayName: string | null;
	hasVerifiedBadge: boolean;
	id: number;
	name: string;
	displayName: string;
};

export type UsersMulti = {
	requestedUsername: string;
	hasVerifiedBadge: boolean;
	id: number;
	name: string;
	displayName: string;
};

export const enum UsersAvatarStates {
	Error = "Error",
	Completed = "Completed",
	InReview = "InReview",
	Pending = "Pending",
	Blocked = "Blocked",
	TemporarilyUnavailable = "TemporarilyUnavailable",
}

export const enum UsersAvatarFormats {
	PNG = "Png",
	JPEG = "Jpeg",
}

export type UsersAvatar = {
	targetId: number;
	state: UsersAvatarStates;
	imageUrl: string;
	version: string;
};

export type UsersSearch = {
	id: number;
	name: string;
	displayName: string;
	description?: string;
	online: boolean;
	profilePath: string;
	hasVerifiedBadge: boolean;
};
