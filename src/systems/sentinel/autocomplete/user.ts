import { ApplicationCommandOptionTypes, Interaction } from "@discordeno/bot";
import { SystemAutocompleteElement, SystemAutocompleteIdentifiers } from "../../systems.js";
import { roblox } from "../../../services/roblox.js";
import { throttle } from "../../../helpers/utility.js";
import { limitString } from "../../../helpers/utility.js";
import { UsersSingle } from "../../../services/roblox/users.js";
import { ErrorCodes, SystemError } from "../../../helpers/errors.js";

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
			return await defaultResponse(interaction);
		}

		throttle(["autocomplete", id, String(interaction.user.id)], String(interaction.id), 750)
			.then(() => {
				if (option.value.startsWith("#"))
					roblox.users
						.single(Number(option.value.substring(1)))
						.then(async (user) => {
							await interaction.respond({
								choices: [formatOption(user)],
							});
						})
						.catch(async (error) => {
							if (
								error instanceof SystemError &&
								(error.code == ErrorCodes.ROBLOX_USER_NOT_FOUND ||
									error.code == ErrorCodes.ROBLOX_USER_INVALID ||
									error.code == ErrorCodes.ROBLOX_USER_TOO_SHORT)
							) {
								await defaultResponse(interaction);
							}
							console.log("user specific request failed: ", error);
						});
				else
					roblox.users
						.search(option.value)
						.then(async (response) => {
							await interaction.respond({
								choices: response.map(formatOption),
							});
						})
						.catch(async (error) => {
							if (
								error instanceof SystemError &&
								(error.code == ErrorCodes.ROBLOX_USER_NOT_FOUND ||
									error.code == ErrorCodes.ROBLOX_USER_TOO_SHORT)
							) {
								await defaultResponse(interaction);
							}
							console.log("user search request failed: ", error);
						});
			})
			.catch(console.error);
	},
} as SystemAutocompleteElement;

function formatOption(user: Pick<UsersSingle, "displayName" | "name" | "id">) {
	return {
		name: limitString(user.displayName, 40) + " (@" + limitString(user.name, 45) + ")",
		value: process.env.SENTINEL_USER_AUTOCOMPLETE_PREFIX + String(user.id),
	};
}

async function defaultResponse(interaction: Interaction): Promise<void> {
	await interaction.respond({
		choices: [],
	});
}
