import { ButtonStyles, MessageComponentTypes, MessageFlags } from "@discordeno/bot";
import {
	ResponseIdentifiers,
	SystemComponentElement,
	SystemComponentIdentifiers,
} from "../../systems.js";
import { cachestore } from "../../../services/cachestore.js";
import { command1CacheData } from "../manager.js";
import { discord } from "../../../services/discord.js";
import { RecordActions, datastore } from "../../../services/datastore.js";
import { response } from "../responses.js";

export const id = SystemComponentIdentifiers.MODERATION_LOG_CONFIRM;
export default {
	id,
	data: {
		customId: id,
		type: MessageComponentTypes.Button,
		// emoji: , TODO: add emoji
		label: "Create Record",
		style: ButtonStyles.Danger,
	},
	async execute(interaction) {
		await interaction.defer(true);

		if (!interaction.message) return;
		const cached = await (async () => {
			const cacheKey = ["cache", interaction.user.id, interaction.message!.id].join("/");
			const data = cachestore.get(cacheKey);
			await cachestore.del(cacheKey);
			return data;
		})();

		if (!cached) return;
		const data = JSON.parse(cached) as command1CacheData;

		await discord.rest
			.executeWebhook(process.env.SENTINEL_WEBHOOK_ID, process.env.SENTINEL_WEBHOOK_TOKEN, {
				// username: '', TODO: support for webhook custom profiles
				// avatarUrl: '',
				wait: true,
				...response[ResponseIdentifiers.MODERATION_RECORD_CREATE]({
					author: interaction.user,
					input: {
						...data.input,
						warningCount:
							data.input.warningCount + (data.input.action == RecordActions.Warning ? 1 : 0),
					},
					roblox: data.roblox,
				}),
			})
			.then(async (message) => {
				if (!message) return await interaction.edit("error214");
				await datastore.records
					.create({
						data: {
							id: BigInt(message.id),
							author: {
								id: interaction.user.id,
							},
							input: {
								user: {
									id: data.roblox.user.id,
								},
								reason: data.input.reason,
								action: data.input.action,
							},
						},
					})
					.then(async () => {
						await interaction.edit(
							response[ResponseIdentifiers.MODERATION_CREATE_CONFIRM_UPDATE]()
						);
						await discord.rest.sendFollowupMessage(interaction.token, {
							...response[ResponseIdentifiers.MODERATION_CREATED_SUCCESS](),
							flags: MessageFlags.Ephemeral,
						});
					})
					.catch(async (error) => {
						console.error("db record create failed: ", error);
						await interaction.edit("error4");
					});
			})
			.catch(async (error) => {
				console.error("record creation failed: ", error);
				await interaction.edit("error231");
			});
	},
} as SystemComponentElement;
