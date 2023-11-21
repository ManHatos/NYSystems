import "dotenv/config";
import { createClient } from "redis";

export const cachestore = createClient({
	url: process.env.CACHE_URL,
	password: process.env.CACHE_PASS
});

cachestore.on("connect", () => console.log("redis connecting"));
cachestore.on("ready", () => console.log("Cachestore service online"));
cachestore.on("error", (error) => console.log("cachestore service error\n" + error));
cachestore.on("reconnecting", () => console.log("cachestore service reconnecting"));
