import "dotenv/config";
import {
	ResponseIdentifiers,
	SystemCommandElement,
	SystemCommandIdentifiers,
} from "../../systems.js";
import { ApplicationCommandOptionTypes, MessageFlags } from "@discordeno/bot";
import { RecordActions, datastore } from "../../../services/datastore.js";
import autocomplete1 from "../autocomplete/user.js";
import { response } from "../responses.js";
import { roblox } from "../../../services/roblox.js";
import { UsersAvatar, UsersAvatarStates } from "../../../services/roblox/users.js";
import { cachestore } from "../../../services/cachestore.js";
import { discord } from "../../../services/discord.js";
import { command1CacheData } from "../manager.js";
import { extractUserAutocompleteID } from "../../../helpers/utility.js";
import { SystemError } from "../../../helpers/errors.js";

export const id = SystemCommandIdentifiers.MODERATION_CREATE_NEW;
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
				type: ApplicationCommandOptionTypes.Integer,
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
	async execute(interaction, values: [string, string, number]) {
		await interaction.defer(true);

		try {
			values[1] == values[1].replaceAll("`", "") || "<invalid reason>";

			const robloxUser = await roblox.users.single(
				extractUserAutocompleteID(values[0]) || values[0]
			);
			const robloxAvatar = await (async () => {
				async function requestAvatar(
					retried?: boolean
				): Promise<UsersAvatar["imageUrl"] | undefined> {
					return await roblox.users.avatars
						.full([robloxUser.id], { size: "720x720" })
						.then(async (avatar) => {
							if (avatar[0]?.state == UsersAvatarStates.Completed) {
								return avatar[0]?.imageUrl;
							} else if (
								!retried &&
								(avatar[0]?.state == UsersAvatarStates.Pending ||
									avatar[0]?.state == UsersAvatarStates.TemporarilyUnavailable ||
									avatar[0]?.state == UsersAvatarStates.Error)
							) {
								console.error("roblox avatar error");
								return await requestAvatar(true);
							}
						})
						.catch((error) => {
							console.error(error);
							return undefined;
						});
				}
				return requestAvatar();
			})();

			const userRecords = await datastore.records.findMany({
				where: {
					input: {
						is: {
							user: {
								id: robloxUser.id,
							},
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});
			const warningCount = userRecords.filter(
				(record) => record.input.action == RecordActions.Warning
			).length;

			await interaction.edit(
				response[ResponseIdentifiers.MODERATION_CREATE_CONFIRM]({
					author: interaction.user,
					history: userRecords,
					input: {
						reason: values[1],
						action: values[2],
						warningCount,
					},
					roblox: {
						user: robloxUser,
						avatar: robloxAvatar,
					},
				})
			);

			const originalResponse = await discord.rest.getOriginalInteractionResponse(interaction.token);
			await cachestore.set(
				["cache", interaction.user.id, originalResponse.id].join("/"),
				JSON.stringify({
					input: {
						reason: values[1],
						action: values[2],
						warningCount,
					},
					roblox: {
						user: robloxUser,
						avatar: robloxAvatar,
					},
				} as command1CacheData),
				{
					expiry: 15 * 60, // expire after interaction tokens are invalidated (15 minutes)
				}
			);
		} catch (error) {
			if (error instanceof SystemError) {
				console.log("systemError /log: ", error);
				await interaction.edit({ content: error.message, flags: MessageFlags.SuppressEmbeds });
			} else {
				await interaction.edit({
					content: new SystemError().message,
					flags: MessageFlags.SuppressEmbeds,
				});
			}
		}
	},
} as SystemCommandElement;
