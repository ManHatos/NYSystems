import {
	ApplicationCommandOption,
	Component,
	CreateContextApplicationCommand,
	CreateSlashApplicationCommand,
	Interaction,
	InteractionDataOption,
} from "@discordeno/bot";

function moduleTypeFunctions<K extends keyof ModuleElementTypes>(
	type: K
): MainModuleManagerSharedFunctions<K> {
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
export const modules = {
	set(module) {
		if (module.autocomplete) this.autocomplete.data.push(...module.autocomplete);
		if (module.components) this.components.data.push(...module.components);
		if (module.commands) this.commands.data.push(...module.commands);
	},
	autocomplete: moduleTypeFunctions("autocomplete"),
	components: moduleTypeFunctions("components"),
	commands: moduleTypeFunctions("commands"),
} as MainModuleManager;

import * as moderation from "./moderation/manager.js";
modules.set(moderation);

// modules typings

export const enum ModuleCommandIdentifiers {
	/** command used to create new moderations for a Roblox user */
	"MODERATION_CREATE_NEW" = "log",
	/** command used to view moderation history for a Roblox user */
	"MODERATION_HISTORY_VIEW" = "records",
}

export const enum ModuleAutocompleteIdentifiers {
	/** command option used to automatically retrieve Roblox users information based on input or on executer's user history */
	"MODERATION_USER" = "user",
}

export const enum ModuleComponentIdentifiers {
	"PLACEHOLDER" = "",
}

export type ModuleManager = {
	[K in keyof ModuleElementTypes]?: ModuleElementTypes[K][];
};

export type MainModuleManager = Required<{
	[K in keyof ModuleElementTypes]: MainModuleManagerSharedFunctions<K>;
}> & {
	/** a function that pushes all elements within a module manager to their respective data storage based on their types (e.g. `autocomplete` elements => `this.autocomplete.data`) */
	set: (module: ModuleManager) => void;
};

export type MainModuleManagerSharedFunctions<K extends keyof ModuleElementTypes> = Required<{
	/** an array of all module elements based on their type */
	data: ModuleElementTypes[K][];
	/** a function that retreives a module element based on its identifier from `this.data` */
	get: (id: string) => ModuleElementTypes[K] | undefined;
	/** a function that returns a boolean indicating whether or not this element identifier was found in `this.data` */
	has: (id: string | undefined | null) => boolean;
}>;

export type ModuleElementTypes = {
	/** autocomplete elements contain data for and handle all interactions referencing autocomplete options */
	autocomplete: ModuleAutocompleteElement;
	/** component elements contain data for and handle all interactions referencing message components such as buttons and select menus, each element contains **one** singular component, all components must be wrapped within an action row */
	components: ModuleComponentElement;
	/** command elements contain data for and handle all interactions referencing application commands such as slash commands */
	commands: ModuleCommandElement;
};

export type ModuleCommandElement = {
	/** the internal identifier for the module element */
	id: ModuleCommandIdentifiers;
	/** the data for the application command */
	data: CreateSlashApplicationCommand & CreateContextApplicationCommand;
	/** the handler for any interactions referencing this element */
	execute: (interaction: Interaction) => Promise<unknown | void>;
};

export type ModuleAutocompleteElement = {
	/** the internal identifier for the module element */
	id: ModuleAutocompleteIdentifiers;
	/** the data for the autocomplete option */
	data: ApplicationCommandOption & {
		autocomplete: true;
	};
	/** the handler for any interactions referencing this element */
	execute: (interaction: Interaction, option: InteractionDataOption) => Promise<unknown | void>;
};

export type ModuleComponentElement = {
	/** the internal identifier for the module element */
	id: ModuleComponentIdentifiers;
	/** the data for the specific component (excluding all action rows) */
	data: MessageComponent;
	/** the handler for any interactions referencing this element */
	execute: (interaction: Interaction) => Promise<unknown | void>;
};

interface MessageComponent extends Omit<Component, "customId"> {
	customId: ModuleComponentIdentifiers;
}
