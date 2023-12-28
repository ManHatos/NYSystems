import { MessageComponentTypes, MessageFlags } from "@discordeno/bot";
import { SystemRID, SystemComponentElement, SystemComponentIdentifiers } from "../../types.js";
import { ManageRecordOptions, component3CacheData, component3CacheData2 } from "../types.js";
import modal1, { values as modal1Values } from "../modals/editReason.js";
import { defaults as component1Default } from "./editAction.js";
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
				description: "Modify the record's reason",
				value: ManageRecordOptions.EDIT_REASON,
				emoji: {
					name: "editPencil",
					id: 1187798081333383198n,
				},
			},
			{
				label: "Action",
				description: "Modify the records action",
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
	async execute(interaction) {
		try {
			if (!interaction.message || !interaction.data?.values) return;

			const record = await datastore.records.findUnique({
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
				interaction.user.id != record.author.id &&
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

			switch (interaction.data.values[0] as ManageRecordOptions) {
				case ManageRecordOptions.EDIT_REASON: {
					await cachestore.set(
						["cache", interaction.user.id, "modal", modal1.id].join("/"),
						{
							message: interaction.message,
							roblox: {
								user: record.input.user,
							},
						} as component3CacheData,
						{
							expiry: 15 * 60,
						}
					);

					modal1Values.reason = record.input.reason;
					await interaction.respond(modal1.data, {
						isPrivate: true,
					});
					modal1Values.reset();
					break;
				}
				case ManageRecordOptions.EDIT_ACTION: {
					component1Default.action = record.input.action;
					await interaction.respond(response[SystemRID.SENTINEL_EDIT_ACTION](), {
						isPrivate: true,
					});
					component1Default.reset();

					const originalResponse = await discord.rest.getOriginalInteractionResponse(
						interaction.token
					);
					await cachestore.set(
						["cache", interaction.user.id, originalResponse.id].join("/"),
						{
							message: interaction.message,
							roblox: {
								user: record.input.user,
							},
						} as component3CacheData,
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
						} as component3CacheData2,
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
} as SystemComponentElement;
