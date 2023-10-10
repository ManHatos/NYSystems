import { SystemCommandElement, SystemCommandIdentifiers } from "../../systems.js";
import autocomplete from "../autocomplete/user.js";

export const id = SystemCommandIdentifiers.MODERATION_HISTORY_VIEW;
export default {
	id,
	data: {
		name: id,
		description: "View a Roblox user's moderation history",
		options: [autocomplete.data],
	},
	async execute(interaction) {},
} as SystemCommandElement;
