declare global {
	namespace NodeJS {
		interface ProcessEnv {
			// discord
			/** the token for the system's Discord bot account */
			DISCORD_TOKEN: string;
			/** the primary guild identifier */
			DISCORD_GUILD: string;

			// roblox
			/** the `.ROBLOSECURITY` cookie for the system's Roblox bot account */
			ROBLOX_TOKEN: string;
			/** the full domain for the Roblox users API */
			ROBLOX_API_USERS: string;
			/** the full domain for the Roblox thumbnails API */
			ROBLOX_API_THUMBNAILS: string;

			// database
			/** the full URL for the connection to the mongoDB database */
			DATABASE_URL: string;
			/** the host of the database */
			DATABASE_HOST: string;
			/** the port of the database */
			DATABASE_PORT: string;

			// cache
			/** the full URL for the connection to the redis cache */
			CACHE_URL: string;
			/** the host of the cache */
			CACHE_HOST: string;
			/** the port of the cache */
			CACHE_PORT: string;

			// asset URIs
			/** image shown when avatars cannot be loaded */
			URI_AVATAR_LOAD_ERROR: string;
			/** image used to limit Discord embeds' width */
			URI_EMBED_WIDTH_LIMITER: string;

			// sentinel system
			/** webhook token for the sentinal system user records */
			SENTINEL_WEBHOOK_TOKEN: string;
			/** webhook id for the sentinal system user records */
			SENTINEL_WEBHOOK_ID: string;

			// sentinel config
			/** default embed color */
			SENTINEL_EMBED_COLOR: string;
		}
	}
}

export {};
