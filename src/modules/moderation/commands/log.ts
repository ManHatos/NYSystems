import { ApplicationCommandOptionTypes } from "@discordeno/bot";
import { ModuleCommandElement, ModuleCommandIdentifiers } from "../../modules.js";
import { RecordActions } from "../../../services/datastore.js";
import autocomplete1 from "../autocomplete/user.js";

export const id = ModuleCommandIdentifiers.MODERATION_CREATE_NEW;
export default {
	id,
	data: {
		name: id,
		description: "Moderate a Roblox user",
		options: [
			autocomplete1.data,
			{
				type: ApplicationCommandOptionTypes.String,
				name: "reason",
				description: "The reason for the moderation",
				required: true,
				maxLength: 100,
			},
			{
				type: ApplicationCommandOptionTypes.String,
				name: "action",
				description: "The action taken on the user",
				required: true,
				choices: Object.keys(RecordActions)
					.filter((key) => isNaN(Number(key)))
					.map((action) => ({
						name: action,
						value: String(RecordActions[action as keyof typeof RecordActions]),
					})),
			},
		],
	},
	async execute(interaction) {},
} as ModuleCommandElement;
