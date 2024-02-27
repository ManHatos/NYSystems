import {
	MessageComponentTypes,
	ButtonStyles,
	MessageFlags,
	ButtonComponent,
} from "@discordeno/bot";
import { SystemComponentElement, SystemComponentIdentifiers } from "../../types.js";
import { SystemError } from "../../../helpers/errors.js";
import { get as getComponent1 } from "./selectName.js";
import { cachestore } from "../../../services/cachestore.js";
import { Component2CacheData } from "../types.js";
import { nexus } from "../../../helpers/nexus.js";
import { NexusRegistrationType } from "../../../services/datastore.js";

export const id = SystemComponentIdentifiers.NEXUS_REGISTRATION_CONFIRM;
export default {
	id,
	data: {
		customId: id,
		type: MessageComponentTypes.Button,
		// emoji: {
		// 	TODO: add emoji
		// },
		label: "Yes, this is my account",
		style: ButtonStyles.Success,
	},
	async execute(interaction) {
		await interaction.defer();

		try {
			if (!interaction.message) return;

			const data = (await cachestore.get(
				["cache", interaction.user.id, interaction.message.id].join("/")
			)) as Component2CacheData;

			await nexus.users.register(
				data.roblox.user.name,
				{ type: NexusRegistrationType.Registered, registrar: data.registrar },
				{ discord: interaction.user.id, roblox: data.roblox.user.id }
			);
			await interaction.edit({
				content:
					"you have successfully been registered\nyou can now set a custom name by using linked roles, or skip this step\nby default, your Roblox username is used\n**this is the final point during alpha testing, if you reached here then the test is successful**",
				components: [
					{
						type: MessageComponentTypes.ActionRow,
						components: [
							getComponent1({
								name: data.roblox.user.name,
								displayName: data.roblox.user.displayName,
							}),
						],
					},
				],
			});
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
