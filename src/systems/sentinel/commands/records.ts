import { ModuleCommandElement, ModuleCommandIdentifiers } from "../../modules.js";
import autocomplete from "../autocomplete/user.js";

export const id = ModuleCommandIdentifiers.MODERATION_HISTORY_VIEW;
export default {
	id,
	data: {
		name: id,
		description: "View a Roblox user's moderation history",
		options: [autocomplete.data],
	},
	async execute(interaction) {},
} as ModuleCommandElement;
