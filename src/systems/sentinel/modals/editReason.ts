import { MessageComponentTypes, MessageFlags, TextStyles } from "@discordeno/bot";
import { SystemRID, SystemModalElement, SystemModalIdentifiers } from "../../types.js";
import { ErrorCodes, ErrorLevels, SystemError } from "../../../helpers/errors.js";
import { cachestore } from "../../../services/cachestore.js";
import { component3CacheData } from "../types.js";
import { RecordActions, datastore } from "../../../services/datastore.js";
import { discord } from "../../../services/discord.js";
import { response } from "../responses.js";
import { roblox } from "../../../services/roblox.js";
import { UsersAvatar, UsersAvatarStates } from "../../../services/roblox/users.js";

export const id = SystemModalIdentifiers.SENTINEL_EDIT_REASON;
export const values = {
	reset() {
		this.reason = "";
	},
	reason: "",
};
export default {
	id,
	data: {
		customId: id,
		title: "Modify Record Reason",
		components: [
			{
				type: MessageComponentTypes.ActionRow,
				components: [
					{
						type: MessageComponentTypes.InputText,
						customId: "reason",
						style: TextStyles.Short,
						label: "Reason",
						placeholder: "Enter the updated reason",
						value: values.reason,
					},
				],
			},
		],
	},
	async execute(interaction) {
		await interaction.defer(true);

		try {
			if (!interaction.data?.components) return;

			const reason =
				interaction.data.components.at(0)?.components?.at(0)?.value || "<unknown reason>";
			const data = (await cachestore.get(["cache", interaction.user.id, "modal", id].join("/"), {
				delete: true,
			})) as component3CacheData;

			const robloxUser = await roblox.users.single(Number(data.roblox.user.id));
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
							reason,
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
						reason,
						action: currentRecord.input.action,
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
				console.log("systemError [editReason]: ", error);
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
} as SystemModalElement;
