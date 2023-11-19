import { ApplicationCommandOptionTypes } from "@discordeno/bot";
import { SystemAutocompleteElement, SystemAutocompleteIdentifiers } from "../../systems.js";
import { roblox } from "../../../services/roblox.js";
import { throttle } from "../../../helpers/utility.js";
import { limitString } from "../../../helpers/utility.js";

export const id = SystemAutocompleteIdentifiers.MODERATION_USER;
export default {
	id,
	data: {
		type: ApplicationCommandOptionTypes.String,
		autocomplete: true,
		name: id,
		description: "The Roblox user's username - type # to use an identifier (ID)",
		required: true,
	},
	async execute(interaction, option: { value: string }) {
		if (option.value.length < 3 && !option.value.startsWith("#")) {
			return await interaction.respond({
				choices: [],
			});
		}

		throttle(["autocomplete", id, String(interaction.user.id)], String(interaction.id), 750)
			.then(() => {
				if (option.value.startsWith("#")) {
					roblox.users
						.single(Number(option.value.substring(1)))
						.then(async (user) => {
							await interaction.respond({
								choices: [
									{
										name:
											limitString(user.displayName, 40) + " (@" + limitString(user.name, 45) + ")",
										value: process.env.SENTINEL_USER_AUTOCOMPLETE_PREFIX + String(user.id),
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
								await interaction.respond({
									choices: [],
								});
							}
						});
				} else {
					roblox.users
						.search(option.value)
						.then(async (response) => {
							await interaction.respond({
								choices: response.map((user) => {
									return {
										name:
											limitString(user.displayName, 40) + " (@" + limitString(user.name, 45) + ")",
										value: process.env.SENTINEL_USER_AUTOCOMPLETE_PREFIX + String(user.id),
									};
								}),
							});
						})
						.catch((e) => console.log("user search request failed: ", e));
				}
			})
			.catch(() => console.error("overwritten"));
	},
} as SystemAutocompleteElement;
