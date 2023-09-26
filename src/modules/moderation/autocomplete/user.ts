import { ApplicationCommandOptionTypes } from "@discordeno/bot";
import { ModuleAutocompleteElement, ModuleAutocompleteIdentifiers } from "../../modules.js";

export const id = ModuleAutocompleteIdentifiers.MODERATION_USER;
export default {
	id,
	data: {
		type: ApplicationCommandOptionTypes.String,
		autocomplete: true,
		name: id,
		description: "The user's Roblox username or identifier (ID)",
		required: true,
	},
	async execute(interaction) {},
} as ModuleAutocompleteElement;
