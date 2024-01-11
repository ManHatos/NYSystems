import { MessageComponentTypes, MessageFlags, SelectOption } from "@discordeno/bot";
import { SystemComponentElement, SystemComponentIdentifiers, SystemRID } from "../../types.js";
import { RecordActions, datastore } from "../../../services/datastore.js";
import { ErrorCodes, ErrorLevels, SystemError } from "../../../helpers/errors.js";
import { cachestore } from "../../../services/cachestore.js";
import { roblox } from "../../../services/roblox.js";
import { UsersAvatar, UsersAvatarStates } from "../../../services/roblox/users.js";
import { component3CacheData } from "../types.js";
import { response } from "../responses.js";
import { discord } from "../../../services/discord.js";

export const id = SystemComponentIdentifiers.SENTINEL_RECORD_ACTION_EDIT;
const component = {
	id,
	data: {
		customId: id,
		type: MessageComponentTypes.SelectMenu,
		options: options(),
		placeholder: "Select Action",
	},
	async execute(interaction) {
		await interaction.defer(true);

		try {
			if (!interaction.message || !interaction.data?.values?.at(0)) return;

			const action = Number(interaction.data.values[0]) as RecordActions;
			const data = (await cachestore.get(
				["cache", interaction.user.id, interaction.message.id].join("/"),
				{
					delete: true,
				}
			)) as component3CacheData;

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
						warningCount: warningCount + 1,
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
export default component;

export const get = (action: RecordActions): typeof component.data => {
	const cloned = { ...component.data };
	if (cloned)
		Object.assign(cloned, {
			options: options(action),
		});
	return cloned;
};

function options(defaults?: RecordActions): SelectOption[] {
	return Object.keys(RecordActions)
		.filter((key) => isNaN(Number(key)))
		.map((action) => ({
			label: action,
			value: String(RecordActions[action as keyof typeof RecordActions]),
			default: typeof defaults != "undefined" ? RecordActions[defaults] == action : false,
		}));
}
