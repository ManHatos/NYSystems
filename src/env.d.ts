declare global {
	namespace NodeJS {
		interface ProcessEnv {
			// discord
			/** the token for the system's Discord bot account */
			DISCORD_TOKEN: string;
			/** the primary guild identifier */
			DISCORD_GUILD: string;
			/** default color used instead of undefined colors in embeds */
			DISCORD_EMBED_COLOR: string;

			// roblox
			/** the `.ROBLOSECURITY` cookie for the system's Roblox bot account */
			ROBLOX_TOKEN: string;

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
			/** the password for authenticating into redis */
			CACHE_PASS: string;
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
			/** webhook token used by sentinal for user records */
			SENTINEL_WEBHOOK_TOKEN: string;
			/** webhook identifier used by sentinal for user records */
			SENTINEL_WEBHOOK_ID: string;
			/** channel identifier used by sentinel for user records */
			SENTINEL_CHANNEL: string;
			/** primary embed color used be sentinel in most messages */
			SENTINEL_EMBED_COLOR_PRIMARY: string;
			/** "preview" embed color used be sentinel in record previews */
			SENTINEL_EMBED_COLOR_PREVIEW: string;
			/** prefix that is used to identify autocomplete choices in autocomplete options */
			SENTINEL_USER_AUTOCOMPLETE_PREFIX: string;
		}
	}
}

export {};
