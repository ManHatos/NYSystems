// additional system typings

import {
	CreateSlashApplicationCommand,
	Interaction,
	InteractionDataOption,
	ApplicationCommandOption,
	ButtonComponent,
	SelectMenuComponent,
	SelectMenuChannelsComponent,
	SelectMenuRolesComponent,
	SelectMenuUsersComponent,
	SelectMenuUsersAndRolesComponent,
	InteractionCallbackData,
	CreateMessageOptions,
	ExecuteWebhook,
	EditMessage,
} from "@discordeno/bot";

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
	// sentinel
	/** component used to confirm the creation of a record */
	"SENTINEL_LOG_CONFIRM" = "SENTINEL_LOG_CONFIRM",
	/** component used to confirm the creation of a ban request */
	"SENTINEL_BR_CONFIRM" = "SENTINEL_BR_CONFIRM",
	/** component used to manage a record (e.g. edit, delete) */
	"SENTINEL_RECORD_MANAGE" = "SENTINEL_RECORD_MANAGE",
	/** component used to modify a record's action type */
	"SENTINEL_RECORD_ACTION_EDIT" = "SENTINEL_RECORD_ACTION_EDIT",
	/** component used to confirm the deletion of a record */
	"SENTINEL_RECORD_DELETE_CONFIRM" = "SENTINEL_RECORD_DELETE_CONFIRM",

	// nexus
	/** component used to start the registration process */
	"NEXUS_START" = "NEXUS_START",
	/** component used to select the method of registration (registrar) */
	"NEXUS_REGISTRAR_SELECT" = "NEXUS_REGISTRAR_SELECT",
	/** component used to confirm registration data */
	"NEXUS_REGISTRATION_CONFIRM" = "NEXUS_REGISTRATION_CONFIRM",
	/** component used to change registration data */
	"NEXUS_REGISTRATION_INCORRECT" = "NEXUS_REGISTRATION_INCORRECT",

	/** component used to select an optional custom name during onboarding */
	"NEXUS_SELECT_NAME" = "NEXUS_SELECT_NAME",
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

export type SystemComponentElement<
	type =
		| ButtonComponent
		| SelectMenuComponent
		| SelectMenuChannelsComponent
		| SelectMenuRolesComponent
		| SelectMenuUsersComponent
		| SelectMenuUsersAndRolesComponent
> = {
	/** the internal identifier for the module element */
	id: SystemComponentIdentifiers;
	/** the data for the specific component (excluding all action rows) */
	data: type;
	/** the handler for any interactions referencing this element */
	execute: (interaction: Interaction, data?: string[]) => Promise<unknown | void>;
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
