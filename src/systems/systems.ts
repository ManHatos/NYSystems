import "dotenv/config";
import {
	ApplicationCommandOption,
	ButtonComponent,
	Camelize,
	CreateMessageOptions,
	CreateSlashApplicationCommand,
	DiscordEmbed,
	EditMessage,
	ExecuteWebhook,
	Interaction,
	InteractionCallbackData,
	InteractionDataOption,
	SelectMenuChannelsComponent,
	SelectMenuComponent,
	SelectMenuRolesComponent,
	SelectMenuUsersAndRolesComponent,
	SelectMenuUsersComponent,
} from "@discordeno/bot";

function systemDefaults<K extends keyof SystemElements>(type: K): MainSystemManagerDefaults<K> {
	return {
		get(id) {
			return this.data.filter((element) => element.id == id)[0] ?? undefined;
		},
		has(id) {
			if (!id) return false;
			return this.data.find((element) => element.id == id) ? true : false;
		},
		data: [],
	};
}

/** the main modules manager, includes all module elements based on their type */
export const systems = {
	set(system) {
		if (system.autocomplete) this.autocomplete.data.push(...system.autocomplete);
		if (system.components) this.components.data.push(...system.components);
		if (system.commands) this.commands.data.push(...system.commands);
		if (system.modals) this.modals.data.push(...system.modals);
	},
	autocomplete: systemDefaults("autocomplete"),
	components: systemDefaults("components"),
	commands: systemDefaults("commands"),
	modals: systemDefaults("modals"),
} as MainSystemManager;

import * as sentinel from "./sentinel/manager.js";
systems.set(sentinel);

// modules typings

export const enum SystemCommandIdentifiers {
	/** command used to create new records for a Roblox user */
	"SENTINEL_CREATE_NEW" = "log",
	/** command used to view record history and information for a Roblox user */
	"SENTINEL_HISTORY_VIEW" = "lookup",
}

export const enum SystemAutocompleteIdentifiers {
	/** command option used to automatically retrieve Roblox users information based on input or on executer's user history */
	"SENTINEL_USER_SEARCH" = "user",
}

export const enum SystemComponentIdentifiers {
	/** component used to confirm the creation of a record */
	"SENTINEL_LOG_CONFIRM" = "confirmRecord",
	/** component used to confirm the creation of a ban request */
	"SENTINEL_BR_CONFIRM" = "confirmBR",
	/** component used to manage a record (e.g. edit, delete) */
	"SENTINEL_RECORD_MANAGE" = "manageRecord",
	/** component used to modify a record's action type */
	"SENTINEL_RECORD_ACTION_EDIT" = "editRecordAction",
	/** component used to confirm the deletion of a record */
	"SENTINEL_RECORD_DELETE_CONFIRM" = "deleteRecordConfirm",
}

export const enum SystemModalIdentifiers {
	/** modal used to modify a record's reason */
	"SENTINEL_EDIT_REASON" = "editRecordReason",
}

export const enum SystemRID {
	// sentinel
	/** response sent prompting a confirmation after a `SENTINEL_CREATE_NEW` interaction */
	"SENTINEL_RECORD_CONFIRM",
	/** response sent prompting a confirmation after a `SENTINEL_CREATE_NEW` interaction with an unauthorized role for bans */
	"SENTINEL_BR_CONFIRM",
	/** response sent following a `SENTINEL_CREATE_NEW` interaction */
	"SENTINEL_CREATE_SUCCESS",
	/** updated `SENTINEL_RECORD_CONFIRM` response shown following a successful record creation */
	"SENTINEL_RECORD_CONFIRM_UPDATE",
	/** a moderation record */
	"SENTINEL_RECORD",
	/** a moderation ban request */
	"SENTINEL_BAN_REQUEST",
	/** response sent following a `SENTINEL_HISTORY_VIEW` interaction */
	"SENTINEL_LOOKUP",
	/** response sent following a `SENTINEL_RECORD_MANAGE` interaction with an `EDIT_ACTION` set choice */
	"SENTINEL_EDIT_ACTION",
	/** response sent following any successful sentinel record edit interaction */
	"SENTINEL_RECORD_MANAGE_SUCCESS",
	/** response sent following a `SENTINEL_RECORD_MANAGE` interaction with a `DELETE` set choice */
	"SENTINEL_RECORD_DELETE",
	/** response sent following a successful `SENTINEL_RECORD_DELETE` interaction */
	"SENTINEL_RECORD_DELETE_SUCCESS",
}

export type SystemManager = {
	[K in keyof SystemElements]?: SystemElements[K][];
};

export type MainSystemManager = Required<{
	[K in keyof SystemElements]: MainSystemManagerDefaults<K>;
}> & {
	/** a function that pushes all elements within a module manager to their respective data storage based on their types (e.g. `autocomplete` elements => `this.autocomplete.data`) */
	set: (module: SystemManager) => void;
};

export type MainSystemManagerDefaults<K extends keyof SystemElements> = Required<{
	/** an array of all module elements based on their type */
	data: SystemElements[K][];
	/** a function that retreives a module element based on its identifier from `this.data` */
	get: (id: string) => SystemElements[K] | undefined;
	/** a function that returns a boolean indicating whether or not this element identifier was found in `this.data` */
	has: (id: string | undefined | null) => boolean;
}>;

export type SystemElements = {
	/** autocomplete elements contain data for and handle all interactions referencing autocomplete options */
	autocomplete: SystemAutocompleteElement;
	/** component elements contain data for and handle all interactions referencing message components such as buttons and select menus, each element contains **one** singular component, all components must be wrapped within an action row */
	components: SystemComponentElement;
	/** command elements contain data for and handle all interactions referencing application commands such as slash commands */
	commands: SystemCommandElement;
	/** modal elements contain data for and handle all interactions referencing text input modals */
	modals: SystemModalElement;
};

export type SystemCommandElement = {
	/** the internal identifier for the module element */
	id: SystemCommandIdentifiers;
	/** the data for the application command */
	data: CreateSlashApplicationCommand;
	/** the handler for any interactions referencing this element */
	execute: (
		interaction: Interaction,
		values: InteractionDataOption["value"][]
	) => Promise<unknown | void>;
};

export type SystemAutocompleteElement = {
	/** the internal identifier for the module element */
	id: SystemAutocompleteIdentifiers;
	/** the data for the autocomplete option */
	data: ApplicationCommandOption & {
		autocomplete: true;
	};
	/** the handler for any interactions referencing this element */
	execute: (interaction: Interaction, option: InteractionDataOption) => Promise<unknown | void>;
};

export type SystemComponentElement = {
	/** the internal identifier for the module element */
	id: SystemComponentIdentifiers;
	/** the data for the specific component (excluding all action rows) */
	data:
		| ButtonComponent
		| SelectMenuComponent
		| SelectMenuChannelsComponent
		| SelectMenuRolesComponent
		| SelectMenuUsersComponent
		| SelectMenuUsersAndRolesComponent;
	/** the handler for any interactions referencing this element */
	execute: (interaction: Interaction) => Promise<unknown | void>;
};

export type SystemModalElement = {
	/** the internal identifier for the module element */
	id: SystemModalIdentifiers;
	/** the data for the specific component (excluding all action rows) */
	data: Pick<InteractionCallbackData, "components" | "customId" | "title">;
	/** the handler for any interactions referencing this element */
	execute: (interaction: Interaction) => Promise<unknown | void>;
};

export type SystemResponse<
	data extends Partial<Record<SystemRID, any>>,
	returns extends Record<
		keyof data,
		CreateMessageOptions | ExecuteWebhook | InteractionCallbackData | EditMessage
	>
> = {
	[key in keyof data]: (data: data[key]) => returns[key];
};

export function Embeds(
	/** an array of discord camelized embed objects that will be converted into the default systems embed format */
	embeds: Pick<
		Embed,
		"author" | "description" | "fields" | "footer" | "thumbnail" | "url" | "title"
	>[],
	/** override the default embed generator format */
	override?: Pick<Embed, "color" | "image" | "timestamp">
): Embed[] {
	return embeds.map((input) => {
		let embed: Camelize<DiscordEmbed> = input;
		embed.color = override?.color ?? Number(process.env.SENTINEL_EMBED_COLOR_PRIMARY);
		embed.image = override?.image ?? {
			url: process.env.URI_EMBED_WIDTH_LIMITER,
		};
		embed.timestamp = override?.timestamp ?? new Date().toISOString();

		return embed;
	});
}

export type Embed = Camelize<DiscordEmbed>;
