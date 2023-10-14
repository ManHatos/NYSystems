import {
	ApplicationCommandOption,
	ButtonComponent,
	CreateContextApplicationCommand,
	CreateSlashApplicationCommand,
	InputTextComponent,
	Interaction,
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
	},
	autocomplete: systemDefaults("autocomplete"),
	components: systemDefaults("components"),
	commands: systemDefaults("commands"),
} as MainSystemManager;

import * as moderation from "./sentinel/manager.js";
systems.set(moderation);

// modules typings

export const enum SystemCommandIdentifiers {
	/** command used to create new moderations for a Roblox user */
	"MODERATION_CREATE_NEW" = "log",
	/** command used to view moderation history for a Roblox user */
	"MODERATION_HISTORY_VIEW" = "records",
}

export const enum SystemAutocompleteIdentifiers {
	/** command option used to automatically retrieve Roblox users information based on input or on executer's user history */
	"MODERATION_USER" = "user",
}

export const enum SystemComponentIdentifiers {
	/** component used to confirm the creation of a moderation log */
	"MODERATION_LOG_CONFIRM" = "confirmLog",
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
};

export type SystemCommandElement = {
	/** the internal identifier for the module element */
	id: SystemCommandIdentifiers;
	/** the data for the application command */
	data: CreateSlashApplicationCommand & CreateContextApplicationCommand;
	/** the handler for any interactions referencing this element */
	execute: (interaction: Interaction) => Promise<unknown | void>;
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
		| InputTextComponent
		| SelectMenuComponent
		| SelectMenuChannelsComponent
		| SelectMenuRolesComponent
		| SelectMenuUsersComponent
		| SelectMenuUsersAndRolesComponent;
	/** the handler for any interactions referencing this element */
	execute: (interaction: Interaction, data: Record<string, any>) => Promise<unknown | void>;
};