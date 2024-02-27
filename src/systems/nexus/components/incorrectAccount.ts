import {
	MessageComponentTypes,
	ButtonStyles,
	MessageFlags,
	ButtonComponent,
} from "@discordeno/bot";
import { SystemComponentElement, SystemComponentIdentifiers } from "../../types.js";
import { SystemError } from "../../../helpers/errors.js";
import { cachestore } from "../../../services/cachestore.js";
import { Component2CacheData } from "../types.js";
import { NexusRegistrars } from "../../../services/datastore.js";
import { wait } from "../../../helpers/utility.js";

export const id = SystemComponentIdentifiers.NEXUS_REGISTRATION_INCORRECT;
export default {
	id,
	data: {
		customId: id,
		type: MessageComponentTypes.Button,
		// emoji: {
		// 	TODO: add emoji
		// },
		label: "Wrong account?",
		style: ButtonStyles.Danger,
	},
	async execute(interaction) {
		await interaction.defer();
		try {
			if (!interaction.message) return;

			const data = (await cachestore.get(
				["cache", interaction.user.id, interaction.message.id].join("/")
			)) as Component2CacheData;

			switch (data.registrar) {
				case NexusRegistrars.Bloxlink: {
					await interaction.edit({
						content: "due to bloxlink limitations, you must continue using Nexus",
						components: [],
					});
					await wait(3000);
					await interaction.delete();
					break;
				}
				case NexusRegistrars.Nexus: {
					// TODO: revoke roblox oauth2 tokens
				}
			}
		} catch (error) {
			if (!interaction.acknowledged) await interaction.respond("ERROR", { isPrivate: true });
			if (error instanceof SystemError) {
				console.log("systemError [confirmAccount]: ", error);
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
} as SystemComponentElement<ButtonComponent>;
