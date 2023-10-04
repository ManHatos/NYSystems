import { cachestore } from "../services/cachestore.js";

/** reduce multiple requests made within `delay` across different child processes, resolves if `value` (a string used to identify the request) was associated with the latest request, rejects if `value` was replaced */
export const throttle = async (group: string[], value: string, delay: number): Promise<void> => {
	return new Promise(async (resolve, reject) => {
		if (group.length < 2) return reject("group is too short");
		else group.push("throttle");
		const cachePath = group.join("/");

		await cachestore.setEx(cachePath, parseInt((delay / 1000).toFixed()) + 10, value);

		await (async (): Promise<void> => {
			return new Promise((resolve) => {
				setTimeout(() => resolve(), delay);
			});
		})();

		const cacheLatest = await cachestore.get(cachePath);

		if (typeof cacheLatest == "string" && cacheLatest == value) return resolve();
		else return reject("overwritten");
	});
};
