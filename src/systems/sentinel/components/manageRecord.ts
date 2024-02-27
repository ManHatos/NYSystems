import { MessageComponentTypes, MessageFlags, SelectMenuComponent } from "@discordeno/bot";
import { SystemRID, SystemComponentElement, SystemComponentIdentifiers } from "../../types.js";
import { ManageRecordOptions, Component3CacheData, Component3CacheData2 } from "../types.js";
import modal1, { get as getModal1 } from "../modals/editReason.js";
import { ErrorCodes, ErrorLevels, SystemError } from "../../../helpers/errors.js";
import { datastore } from "../../../services/datastore.js";
import { response } from "../responses.js";
import { cachestore } from "../../../services/cachestore.js";
import { discord } from "../../../services/discord.js";

export const id = SystemComponentIdentifiers.SENTINEL_RECORD_MANAGE;
export default {
	id,
	data: {
		customId: id,
		type: MessageComponentTypes.SelectMenu,
		options: [
			{
				label: "Reason",
				description: "Modify the reason for this record",
				value: ManageRecordOptions.EDIT_REASON,
				emoji: {
					name: "editPencil",
					id: 1187798081333383198n,
				},
			},
			{
				label: "Action",
				description: "Modify the action for this record",
				value: ManageRecordOptions.EDIT_ACTION,
				emoji: {
					name: "editPencil",
					id: 1187798081333383198n,
				},
			},
			{
				label: "Delete",
				description: "Permanently delete this record",
				value: ManageRecordOptions.DELETE,
				emoji: {
					name: "trash",
					id: 1187800353664663623n,
				},
			},
		],
		placeholder: "Manage Record",
	},
	async execute(interaction, values: [ManageRecordOptions]) {
		try {
			if (!interaction.message) return;

			const record = await datastore.record.findUnique({
				where: {
					id: interaction.message.id,
				},
			});

			if (!record)
				throw new SystemError({
					code: ErrorCodes.NOT_FOUND,
					message: "This record does not exist.\nPlease notify system admin.",
					cause: "Datastore could not find record: " + interaction.message.id,
					level: ErrorLevels.System,
				});

			if (
				// TODO: update comparison to check Nexus user object
				interaction.user.id != 0n &&
				!interaction.member?.roles?.find((role) =>
					process.env.SENTINEL_SU_ROLES.split(",")?.includes(String(role))
				)
			)
				throw new SystemError({
					code: ErrorCodes.UNAUTHORIZED,
					message: "You do not own this record.\nYou cannot manage other people's records.",
					cause:
						"Interaction `member.roles` does not include any elements from `SENTINEL_SU_ROLES`",
					level: ErrorLevels.User,
				});

			switch (values[0]) {
				case ManageRecordOptions.EDIT_REASON: {
					await cachestore.set(
						["cache", interaction.user.id, "modal", modal1.id].join("/"),
						{
							message: interaction.message,
							roblox: {
								user: record.info.user,
							},
						} as Component3CacheData,
						{
							expiry: 15 * 60,
						}
					);

					await interaction.respond(getModal1(record.info.reason), {
						isPrivate: true,
					});
					break;
				}
				case ManageRecordOptions.EDIT_ACTION: {
					await interaction.respond(
						response[SystemRID.SENTINEL_EDIT_ACTION]({ default: record.info.action }),
						{
							isPrivate: true,
						}
					);

					const originalResponse = await discord.rest.getOriginalInteractionResponse(
						interaction.token
					);
					await cachestore.set(
						["cache", interaction.user.id, originalResponse.id].join("/"),
						{
							message: interaction.message,
							roblox: {
								user: record.info.user, // TODO: update caching to support Nexus user objects
							},
						} as Component3CacheData,
						{
							expiry: 15 * 60,
						}
					);
					break;
				}
				case ManageRecordOptions.DELETE: {
					await interaction.respond(response[SystemRID.SENTINEL_RECORD_DELETE](), {
						isPrivate: true,
					});

					const originalResponse = await discord.rest.getOriginalInteractionResponse(
						interaction.token
					);
					await cachestore.set(
						["cache", interaction.user.id, originalResponse.id].join("/"),
						{
							message: interaction.message,
						} as Component3CacheData2,
						{
							expiry: 15 * 60,
						}
					);
					break;
				}
				default: {
					throw new SystemError();
				}
			}
		} catch (error) {
			if (!interaction.acknowledged) await interaction.respond("ERROR", { isPrivate: true });
			if (error instanceof SystemError) {
				console.log("systemError [- manageRecord]: ", error);
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
} as SystemComponentElement<SelectMenuComponent>;
