import { ApplicationCommandOptionTypes } from "@discordeno/bot";
import { ModuleCommandElement, ModuleCommandIdentifiers } from "../../types.js";
import autocomplete from "../autocomplete/user.js";

export const id = ModuleCommandIdentifiers.MODERATION_CREATE_NEW;
export default {
	id,
	data: {
		name: id,
		description: "Moderate a Roblox user",
		options: [
			autocomplete.data,
			{
				type: ApplicationCommandOptionTypes.String,
				name: "reason",
				description: "The reason for the moderation",
				required: true,
			},
			{
				type: ApplicationCommandOptionTypes.String,
				name: "action",
				description: "The action taken on the user",
				required: true,
			},
		],
	},
	async execute(interaction) {},
} as ModuleCommandElement;
