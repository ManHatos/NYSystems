import { ButtonStyles, MessageComponentTypes, MessageFlags } from "@discordeno/bot";
import {
	ResponseIdentifiers,
	SystemComponentElement,
	SystemComponentIdentifiers,
} from "../../systems.js";
import { cachestore } from "../../../services/cachestore.js";
import { command1CacheData } from "../manager.js";
import { discord } from "../../../services/discord.js";
import { BanRequestStates, datastore } from "../../../services/datastore.js";
import { response } from "../responses.js";
import { ErrorCodes, ErrorLevels, SystemError } from "../../../helpers/errors.js";

export const id = SystemComponentIdentifiers.MODERATION_BR_CONFIRM;
export default {
	id,
	data: {
		customId: id,
		type: MessageComponentTypes.Button,
		emoji: {
			id: 1183058928720953395n,
			name: "addRecord",
		},
		label: "Submit Ban Request",
		style: ButtonStyles.Danger,
	},
	async execute(interaction) {
		await interaction.defer(true);

		try {
			if (!interaction.message) return;
			const cached = await (async () => {
				const cacheKey = ["cache", interaction.user.id, interaction.message!.id].join("/");
				const data = cachestore.get(cacheKey);
				await cachestore.delete(cacheKey);
				return data;
			})();

			if (!cached) return;
			const data = JSON.parse(cached) as command1CacheData;

			if (data.input.action != "Ban Request") return;

			const requestMessage = await discord.rest.sendMessage(process.env.SENTINEL_BR_CHANNEL_ID, {
				...response[ResponseIdentifiers.MODERATION_BAN_REQUEST]({
					author: interaction.user,
					input: {
						reason: data.input.reason,
					},
					roblox: data.roblox,
				}),
			});

			if (
				await datastore.banRequests.findFirst({
					where: {
						input: {
							is: {
								user: {
									id: data.roblox.user.id,
								},
							},
						},
						state: BanRequestStates.Pending,
					},
				})
			)
				throw new SystemError({
					code: ErrorCodes.DUPLICATE_RESOURCE,
					message: `The user \` ${data.roblox.user.name} \` has a pending ban request.`,
					level: ErrorLevels.User,
					cause: "Ban request pending alread exists",
				});

			await datastore.banRequests.create({
				data: {
					id: BigInt(requestMessage.id),
					author: {
						id: interaction.user.id,
					},
					input: {
						user: {
							id: data.roblox.user.id,
						},
						reason: data.input.reason,
					},
					state: BanRequestStates.Pending,
				},
			});

			await interaction.edit(response[ResponseIdentifiers.MODERATION_CREATE_CONFIRM_UPDATE]());
			await discord.rest.sendFollowupMessage(interaction.token, {
				...response[ResponseIdentifiers.MODERATION_CREATED_SUCCESS](),
				flags: MessageFlags.Ephemeral,
			});
		} catch (error) {
			if (error instanceof SystemError) {
				console.log("systemError [confirmLog]: ", error);
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
