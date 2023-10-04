import { ApplicationCommandOptionTypes } from "@discordeno/bot";
import { ModuleAutocompleteElement, ModuleAutocompleteIdentifiers } from "../../modules.js";
import { users } from "../../../services/roblox.js";
import { throttle } from "../../../helpers/throttle.js";
import { limitString } from "../../../helpers/utility.js";

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
	async execute(interaction) {
		const focusedOption = interaction.data?.options?.find((option) => option.focused);

		if (String(focusedOption!.value).length < 3)
			return await interaction.respond({
				choices: [],
			});

		throttle(["autocomplete", id, String(interaction.user.id)], String(interaction.id), 750)
			.then(() => {
				users
					.search(String(focusedOption!.value))
					.then(async (response) => {
						await interaction.respond({
							choices: response.map((user) => {
								return {
									name:
										limitString(user.displayName, 40) + " (@" + limitString(user.name, 45) + ")",
									value: String(user.id),
								};
							}),
						});
					})
					.catch((e) => {
						console.log("user search request failed: ", e);
						users
							.multiple([String(focusedOption!.value!)])
							.then(async (response) => {
								await interaction.respond({
									choices: response.map((user) => {
										return {
											name:
												limitString(user.displayName, 40) +
												" (@" +
												limitString(user.name, 45) +
												")",
											value: String(user.id),
										};
									}),
								});
							})
							.catch((e) => console.log("users multiple request failed: ", e));
					});
			})
			.catch(() => console.error("overwritten"));
	},
} as ModuleAutocompleteElement;
