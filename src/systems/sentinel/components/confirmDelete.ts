import { MessageComponentTypes, ButtonStyles, MessageFlags } from "@discordeno/bot";
import { SystemComponentElement, SystemComponentIdentifiers, SystemRID } from "../../systems.js";
import { ErrorCodes, ErrorLevels, SystemError } from "../../../helpers/errors.js";
import { datastore } from "../../../services/datastore.js";
import { cachestore } from "../../../services/cachestore.js";
import { component3CacheData2 } from "../manager.js";
import { response } from "../responses.js";
import { discord } from "../../../services/discord.js";

export const id = SystemComponentIdentifiers.SENTINEL_RECORD_DELETE_CONFIRM;
export default {
	id,
	data: {
		customId: id,
		type: MessageComponentTypes.Button,
		emoji: {
			id: 1188965739944751174n,
			name: "trash_white",
		},
		label: "Confirm Deletion",
		style: ButtonStyles.Danger,
	},
	async execute(interaction) {
		await interaction.defer(true);

		try {
			const cached = await (async () => {
				const cacheKey = ["cache", interaction.user.id, "button", id].join("/");
				const data = cachestore.get(cacheKey);
				await cachestore.delete(cacheKey);
				return data;
			})();

			if (!cached) return;
			const data = JSON.parse(cached) as component3CacheData2;

			const record = await datastore.records.findUnique({
				where: {
					id: data.message.id,
				},
			});

			if (!record)
				throw new SystemError({
					code: ErrorCodes.NOT_FOUND,
					message: "This record no longer exists.",
					cause: "Datastore could not find record: " + data.message.id,
					level: ErrorLevels.System,
				});

			await datastore.records.delete({
				where: {
					id: data.message.id,
				},
			});

			await discord.rest.deleteMessage(
				process.env.SENTINEL_CHANNEL_ID,
				data.message.id,
				"Record deleted by @" + interaction.user.username
			);
			await interaction.edit(response[SystemRID.SENTINEL_RECORD_DELETE_SUCCESS]());
		} catch (error) {
			if (!interaction.acknowledged) await interaction.respond("ERROR", { isPrivate: true });
			if (error instanceof SystemError) {
				console.log("systemError [confirmDelete]: ", error);
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