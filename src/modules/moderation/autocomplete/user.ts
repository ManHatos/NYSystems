import { ApplicationCommandOptionTypes } from "@discordeno/bot";
import { ModuleAutocompleteElement, ModuleAutocompleteIdentifiers } from "../../modules.js";
import { roblox } from "../../../services/roblox.js";
import { throttle } from "../../../helpers/throttle.js";
import { limitString } from "../../../helpers/utility.js";

export const id = ModuleAutocompleteIdentifiers.MODERATION_USER;
export default {
	id,
	data: {
		type: ApplicationCommandOptionTypes.String,
		autocomplete: true,
		name: id,
		description:
			'The user\'s Roblox username or identifier (ID), use "#" to search using an identifier (ID)',
		required: true,
	},
	async execute(interaction, option) {
		if (typeof option.value != "string") return;
		const input = option.value;

		if (input.length < 3 && !input.startsWith("#")) {
			return await interaction.respond({
				choices: [],
			});
		}

		throttle(["autocomplete", id, String(interaction.user.id)], String(interaction.id), 750)
			.then(() => {
				if (input.startsWith("#")) {
					roblox.users
						.single(Number(input.substring(1)))
						.then(async (user) => {
							await interaction.respond({
								choices: [
									{
										name:
											limitString(user.displayName, 40) + " (@" + limitString(user.name, 45) + ")",
										value: "::" + String(user.id),
									},
								],
							});
						})
						.catch(async (e) => {
							console.log("user specific request failed: ", e);
							if (
								typeof e == "string" &&
								(e.includes("does not exist") || e == "invalid identifier")
							) {
								console.log("test success");
								await interaction.respond({
									choices: [],
								});
							}
						});
				} else {
					roblox.users
						.search(input)
						.then(async (response) => {
							await interaction.respond({
								choices: response.map((user) => {
									return {
										name:
											limitString(user.displayName, 40) + " (@" + limitString(user.name, 45) + ")",
										value: "::" + String(user.id),
									};
								}),
							});
						})
						.catch((e) => console.log("user search request failed: ", e));
				}
			})
			.catch(() => console.error("overwritten"));
	},
} as ModuleAutocompleteElement;
