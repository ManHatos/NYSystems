import "dotenv/config";

// re-exporting supported Roblox APIs
import { users } from "./roblox/users.js";

// contact the Roblox APIs
export const roblox = {
	/** contact the users.roblox.com APIs */
	users,
};

/** send authenticated HTTP requests to supported Roblox APIs */
export const request: Record<
	"users" | "thumbnails" | "core",
	(method: HTTPMethods, path: string, options?: HTTPOptions) => Promise<Response>
> = {
	users: function (method, path, options?) {
		return sendRequest(RobloxAPIs.users, method, path, options);
	},
	thumbnails: function (method, path, options?) {
		return sendRequest(RobloxAPIs.thumbnails, method, path, options);
	},
	core: function (method, path, options?) {
		return sendRequest(RobloxAPIs.core, method, path, { ...options, version: 0 });
	},
};

/** send raw customizable requests to supported Roblox APIs */
function sendRequest(
	api: RobloxAPIs,
	method: HTTPMethods,
	path: string,
	options: HTTPOptions = {}
): Promise<Response> {
	const request: Record<string, any> = {
		method,
		headers: {
			COOKIE: `.ROBLOSECURITY=${process.env.ROBLOX_TOKEN}`,
		},
	};
	const endpoint =
		"https://" + api + (options.version != 0 ? `/v${options.version ?? 1}` : "") + path;

	if (options.token) request.headers["X-CSRF-TOKEN"] = options.token;
	if (options.body) request.body = JSON.stringify(options.body);

	return fetch(
		options.params ? endpoint.concat("?" + new URLSearchParams(options.params)) : endpoint,
		request
	);
}

type HTTPMethods = "GET" | "POST" | "PATCH" | "HEAD" | "PUT" | "DELETE";

type HTTPOptions = {
	version?: 0 | 1 | 2;
	token?: string;
	body?: Record<string, any>;
	params?: Record<string, any>;
};

enum RobloxAPIs {
	"users" = "users.roblox.com",
	"thumbnails" = "thumbnails.roblox.com",
	"core" = "www.roblox.com",
}
