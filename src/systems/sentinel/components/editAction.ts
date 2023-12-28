import { MessageComponentTypes, MessageFlags } from "@discordeno/bot";
import { SystemComponentElement, SystemComponentIdentifiers, SystemRID } from "../../systems.js";
import { RecordActions, datastore } from "../../../services/datastore.js";
import { ErrorCodes, ErrorLevels, SystemError } from "../../../helpers/errors.js";
import { cachestore } from "../../../services/cachestore.js";
import { roblox } from "../../../services/roblox.js";
import { UsersAvatar, UsersAvatarStates } from "../../../services/roblox/users.js";
import { component3CacheData } from "../manager.js";
import { response } from "../responses.js";
import { discord } from "../../../services/discord.js";

export const id = SystemComponentIdentifiers.SENTINEL_RECORD_ACTION_EDIT;
export const defaults = {
	reset() {
		this.action = undefined;
	},
	action: undefined as RecordActions | undefined,
};
export default {
	id,
	data: {
		customId: id,
		type: MessageComponentTypes.SelectMenu,
		options: Object.keys(RecordActions)
			.filter((key) => isNaN(Number(key)))
			.map((action) => ({
				label: action,
				value: String(RecordActions[action as keyof typeof RecordActions]),
				default:
					typeof defaults.action != "undefined" ? RecordActions[defaults.action] == action : false,
			})),
		placeholder: "Select Action",
	},
	async execute(interaction) {
		await interaction.defer(true);

		try {
			if (!interaction.data?.values?.at(0)) return;

			const action = Number(interaction.data.values[0]) as RecordActions;
			const cached = await (async () => {
				const cacheKey = ["cache", interaction.user.id, "menu", id].join("/");
				const data = cachestore.get(cacheKey);
				await cachestore.delete(cacheKey);
				return data;
			})();

			if (!cached) return;
			const data = JSON.parse(cached) as component3CacheData;

			const robloxUser = await roblox.users.single(String(data.roblox.user.id));
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
								id: data.roblox.user.id,
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

			const currentRecord = userRecords.find((record) => record.id == data.message.id);
			if (!currentRecord)
				throw new SystemError({
					code: ErrorCodes.NOT_FOUND,
					message: "This record no longer exists.",
					cause: "Datastore could not find record: " + data.message.id,
					level: ErrorLevels.System,
				});

			await datastore.records.update({
				where: {
					id: currentRecord.id,
				},
				data: {
					editors: {
						push: {
							user: {
								id: interaction.user.id,
							},
						},
					},
					input: {
						update: {
							action,
						},
					},
				},
			});

			await discord.rest.editMessage(
				process.env.SENTINEL_CHANNEL_ID,
				currentRecord.id,
				response[SystemRID.SENTINEL_RECORD]({
					author: interaction.user,
					input: {
						reason: currentRecord.input.reason,
						action,
						warningCount,
					},
					roblox: {
						user: robloxUser,
						avatar: robloxAvatar,
					},
				})
			);
			await interaction.edit(response[SystemRID.SENTINEL_RECORD_MANAGE_SUCCESS]());
		} catch (error) {
			if (!interaction.acknowledged) await interaction.respond("ERROR", { isPrivate: true });
			if (error instanceof SystemError) {
				console.log("systemError [- editAction]: ", error);
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
					components: [],
				});
			}
		}
	},
} as SystemComponentElement;