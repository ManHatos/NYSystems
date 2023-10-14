import "dotenv/config";
import { request as roblox } from "../roblox.js";

export const users = {
	/** return detailed information about a roblox user using their unique identifier or username (more requests) */
	single: async function (query: string | number): Promise<UsersSingle> {
		return new Promise(async (resolve, reject) => {
			let id: number;
			if (typeof query == "string") {
				if (query.length < 3) return reject("username is too short");
				if (!query.match(/^(?=^[^_\n]+_?[^_\n]+$)\w{3,}$/gm)) return reject("invalid username");

				try {
					const userData = await this.multiple([query]);
					id = userData[0]!.id;
				} catch (error) {
					return reject("retrieving username data failed");
				}
			} else {
				id = query;
			}

			if (!isFinite(id) || id == 0) return reject("invalid identifier");

			roblox
				.users("GET", "/users/" + id)
				.then(async (response) => {
					const body = await response.json();
					if (response.ok) resolve(body);
					else if (response.status == 404 && body?.errors[0]?.code == 3)
						reject(`user ${id} does not exit`);
					else {
						reject("unknown request error");
					}
				})
				.catch(() => reject("request failed"));
		});
	},

	/** return basic information about multiple roblox users using their usernames or identifiers */
	multiple: async function (
		query: string[] | number[],
		banned: boolean = false
	): Promise<UsersMulti[]> {
		return new Promise(async (resolve, reject) => {
			if (query.length == 0) return reject("no query provided");
			if (query.every((item) => typeof item == "string")) {
				roblox
					.users("POST", "/usernames/users", {
						body: {
							usernames: query,
							excludeBannedUsers: banned,
						},
					})
					.then(async (response) => {
						const body = await response.json();
						if (response.ok) {
							resolve(body?.data);
						} else if (response.status == 400 && body?.errors[0]?.code == 2)
							reject("too many usernames provided");
						else reject("unknown request error");
					})
					.catch(() => reject("request failed"));
			} else if (query.every((item) => typeof item == "number")) {
				roblox
					.users("POST", "/users", {
						body: {
							userIds: query,
							excludeBannedUsers: banned,
						},
					})
					.then(async (response) => {
						const body = await response.json();
						if (response.ok) resolve(body?.data);
						else if (response.status == 400 && body?.errors[0]?.code == 1)
							reject("too many identifiers provided");
						else reject("unknown request error");
					})
					.catch(() => reject("request failed"));
			}
		});
	},

	/** search for a roblox user using their username, currently no support for pagination */
	search: async function (query: string, limit: 10 | 25 | 50 | 100 = 10): Promise<UsersSearch[]> {
		return new Promise((resolve, reject) => {
			if (query.length < 3) return reject("query is too short");
			roblox
				.users("GET", "/users/search", {
					params: {
						keyword: query,
						limit,
					},
				})
				.then(async (response) => {
					const body = await response.json();
					if (response.ok) resolve(body?.data);
					else if (response.status == 400 && body?.errors[0]?.code == 2)
						reject("query was filtered");
					else reject("unknown request error");
				})
				.catch(() => reject("request failed"));
		});
	},

	avatars: {
		/** return full avatars of multiple users using their identifiers */
		full: async function (
			query: number[],
			size:
				| "30x30"
				| "48x48"
				| "60x60"
				| "75x75"
				| "100x100"
				| "110x110"
				| "140x140"
				| "150x150"
				| "180x180"
				| "250x250"
				| "352x352"
				| "420x420"
				| "720x720" = "420x420",
			circular: boolean = false
		): Promise<UsersAvatar[]> {
			return new Promise(async (resolve, reject) => {
				roblox
					.thumbnails("GET", "/users/avatar", {
						params: {
							userIds: String(query),
							size: String(size),
							format: "Png",
							isCircular: String(circular),
						},
					})
					.then(async (response) => {
						const body = await response.json();
						if (response.ok) resolve(body?.data);
						else if (response.status == 400 && body?.errors[0].code == 1)
							reject("too many identifiers provided");
						else reject("unknown request error");
					})
					.catch(() => reject("request failed"));
			});
		},

		/** return avatar busts (from chest and above) of multiple users using their identifiers */
		bust: async function (
			query: number[],
			size:
				| "48x48"
				| "50x50"
				| "60x60"
				| "75x75"
				| "100x100"
				| "150x150"
				| "180x180"
				| "352x352"
				| "420x420" = "420x420",
			circular: boolean = false
		): Promise<UsersAvatar[]> {
			return new Promise(async (resolve, reject) => {
				roblox
					.thumbnails("GET", "/users/avatar-bust", {
						params: {
							userIds: query,
							size: size,
							format: "Png",
							isCircular: circular,
						},
					})
					.then(async (response) => {
						const body = await response.json();
						if (response.ok) resolve(body?.data);
						else if (response.status == 400 && body?.errors[0].code == 1)
							reject("too many identifiers provided");
						else reject("unknown request error");
					})
					.catch(() => reject("request failed"));
			});
		},

		/** return avatar headshots of multiple users using their identifiers */
		headshot: async function (
			query: number[],
			size:
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
				| "720x720" = "420x420",
			circular: boolean = false
		): Promise<UsersAvatar[]> {
			return new Promise(async (resolve, reject) => {
				roblox
					.thumbnails("GET", "/users/avatar-headshot", {
						params: {
							userIds: query,
							size: size,
							format: "Png",
							isCircular: circular,
						},
					})
					.then(async (response) => {
						const body = await response.json();
						if (response.ok) resolve(body?.data);
						else if (response.status == 400 && body?.errors[0].code == 1)
							reject("too many identifiers provided");
						else reject("unknown request error");
					})
					.catch(() => reject("request failed"));
			});
		},
	},
};

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

export type UsersAvatar = {
	targetId: number;
	state: "Error" | "Completed" | "InReview" | "Pending" | "Blocked" | "TemporarilyUnavailable";
	imageUrl: string;
	version: string;
};

export type UsersSearch = {
	previousUsernames: string[];
	hasVerifiedBadge: boolean;
	id: number;
	name: string;
	displayName: string;
};