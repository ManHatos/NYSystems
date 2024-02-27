import "dotenv/config";
import { SystemRID, SystemCommandElement, SystemCommandIdentifiers } from "../../types.js";
import { ApplicationCommandOptionTypes, MessageFlags } from "@discordeno/bot";
import {
	BanRequest,
	BanRequestStates,
	RecordActions,
	datastore,
} from "../../../services/datastore.js";
import autocomplete1 from "../autocomplete/user.js";
import { response } from "../responses.js";
import { roblox } from "../../../services/roblox.js";
import { UsersAvatar, UsersAvatarStates } from "../../../services/roblox/users.js";
import { cachestore } from "../../../services/cachestore.js";
import { discord } from "../../../services/discord.js";
import { Command1CacheData } from "../types.js";
import { extractUserAutocompleteID } from "../../../helpers/utility.js";
import { ErrorCodes, ErrorLevels, SystemError } from "../../../helpers/errors.js";

export const id = SystemCommandIdentifiers.SENTINEL_CREATE_NEW;
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
				description: "The reason behind taking the action",
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
	async execute(interaction, values: [string, string, RecordActions | BanRequest]) {
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

			const userRecords = await datastore.record.findMany({
				where: {
					info: {
						is: {
							user: "", // TODO: get user object prior to finding records
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});
			const warningCount = userRecords.filter(
				(record) => record.info.action == RecordActions.Warning
			).length;
			const banRequests = await datastore.banRequest.findMany({
				where: {
					info: {
						is: {
							user: "", // TODO: get user object prior to finding records
						},
					},
				},
			});

			if (
				!interaction.member?.roles.find((role) =>
					process.env.SENTINEL_BR_ROLES.split(",")?.includes(String(role))
				) &&
				values[2] == RecordActions.Ban
			) {
				values[2] = "Ban Request";
				const banRequests = await datastore.banRequest.findMany({
					where: {
						info: {
							is: {
								user: "", // TODO: get user object prior to finding records
								state: BanRequestStates.Pending,
							},
						},
					},
				});

				if (banRequests.length > 0)
					throw new SystemError({
						code: ErrorCodes.DUPLICATE_RESOURCE,
						message: `The user \` ${robloxUser.name} \` has a pending ban request.`,
						level: ErrorLevels.User,
						cause: "Ban request pending alread exists",
					});

				await interaction.edit(
					response[SystemRID.SENTINEL_BR_CONFIRM]({
						author: interaction.user,
						history: userRecords,
						input: {
							reason: values[1],
							state: BanRequestStates.Pending,
						},
						roblox: {
							user: robloxUser,
							avatar: robloxAvatar,
						},
					})
				);
			} else if (values[2] != "Ban Request") {
				await interaction.edit(
					response[SystemRID.SENTINEL_RECORD_CONFIRM]({
						author: interaction.user,
						history: { records: userRecords, banRequests: banRequests[0] },
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
			}

			const originalResponse = await discord.rest.getOriginalInteractionResponse(interaction.token);
			await cachestore.set(
				["cache", interaction.user.id, originalResponse.id].join("/"),
				{
					input: {
						reason: values[1],
						action: values[2],
						warningCount,
					},
					roblox: {
						user: robloxUser,
						avatar: robloxAvatar,
					},
				} as Command1CacheData,
				{
					expiry: 15 * 60, // expire after interaction tokens are invalidated (15 minutes)
				}
			);
		} catch (error) {
			if (!interaction.acknowledged) await interaction.respond("ERROR", { isPrivate: true });
			if (error instanceof SystemError) {
				console.log("systemError /log: ", error);
				await interaction.edit({
					content: error.message,
					flags: MessageFlags.SuppressEmbeds,
					components: [],
				});
			} else {
				console.log(error);
				await interaction.edit({
					content: new SystemError().message,
					flags: MessageFlags.SuppressEmbeds,
				});
			}
		}
	},
} as SystemCommandElement;
