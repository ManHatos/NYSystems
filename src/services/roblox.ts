import "dotenv/config";

/** send authenticated HTTP requests to supported Roblox APIs */
export const request = {
	users: function (
		method: HTTPMethods,
		endpoint: string,
		options?: HTTPOptions,
		version?: APIVersions,
		authenticate?: boolean
	) {
		return makeRequest("users", method, endpoint, options, version, authenticate);
	},
	thumbnails: function (
		method: HTTPMethods,
		endpoint: string,
		options?: HTTPOptions,
		version?: APIVersions,
		authenticate?: boolean
	) {
		return makeRequest("thumbnails", method, endpoint, options, version, authenticate);
	},
};

// re-exporting supported Roblox APIs
import { users } from "./roblox/users.js";

// contact the Roblox APIs
export const roblox = {
	/** contact the users.roblox.com APIs */
	users,
};

/** send raw customizable requests to supported Roblox APIs */
function makeRequest(
	type: "users" | "thumbnails",
	method: HTTPMethods,
	endpoint: string,
	options?: HTTPOptions,
	version: APIVersions = 1,
	authenticate: boolean = true
) {
	const request: Record<string, any> = {
		method,
		headers: {},
	};
	let url =
		"https://" + process.env["ROBLOX_API_" + type.toUpperCase()] + `/v${version}` + endpoint;

	if (authenticate) request.headers["COOKIE"] = `.ROBLOSECURITY=${process.env.ROBLOX_TOKEN}`;
	if (options?.token) request.headers["X-CSRF-TOKEN"] = options.token;
	if (options?.body) request.body = JSON.stringify(options.body);
	if (options?.params) url = url + "?" + new URLSearchParams(options.params);

	return fetch(url, request);
}

type HTTPMethods = "GET" | "POST" | "PATCH" | "HEAD" | "PUT" | "DELETE";
type HTTPOptions = {
	body?: Record<string, any>;
	token?: string;
	params?: Record<string, any>;
};
type APIVersions = 1 | 2;
