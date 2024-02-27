import { MessageComponentTypes, MessageFlags, SelectMenuComponent } from "@discordeno/bot";
import { ErrorCodes, SystemError } from "../../../helpers/errors.js";
import { SystemComponentElement, SystemComponentIdentifiers } from "../../types.js";
import { Component2CacheData, NexusRegistrarLabels } from "../types.js";
import { bloxlink } from "../../../services/bloxlink.js";
import { roblox } from "../../../services/roblox.js";
import { cachestore } from "../../../services/cachestore.js";
import { NexusRegistrars } from "../../../services/datastore.js";
import component1 from "./confirmAccount.js";
import component2 from "./incorrectAccount.js";
import { nexus } from "../../../helpers/nexus.js";

export const id = SystemComponentIdentifiers.NEXUS_REGISTRAR_SELECT;
export default {
	id,
	data: {
		customId: id,
		type: MessageComponentTypes.SelectMenu,
		options: [
			{
				label: NexusRegistrarLabels.Bloxlink,
				description: "Register using an existing Bloxlink account",
				value: NexusRegistrarLabels.Bloxlink,
				// emoji: {
				// 	TODO: add emoji
				// },
			},
			{
				label: NexusRegistrarLabels.Nexus,
				description: "Register using our Nexus systems",
				value: NexusRegistrarLabels.Nexus,
				// emoji: {
				// 	TODO: add emoji
				// },
			},
		],
		placeholder: "Choose a registration method",
	},
	async execute(interaction, values: [keyof typeof NexusRegistrarLabels]) {
		await interaction.defer();

		try {
			if (!interaction.message) return;

			const userAccount = await nexus.users
				.find({
					discord: interaction.user.id,
				})
				.catch((error) => {
					if (error instanceof SystemError && error.code == ErrorCodes.NEXUS_USER_NOT_FOUND) return;
					else throw error;
				});

			if (userAccount) return await interaction.edit("you have an existing account");

			switch (values[0]) {
				case NexusRegistrarLabels.Bloxlink: {
					const linkedAccount = await bloxlink.linked.discord(interaction.user.id);
					const robloxUser = await roblox.users.single(linkedAccount.id);

					await cachestore.set(
						["cache", interaction.user.id, interaction.message.id].join("/"),
						{
							roblox: {
								user: robloxUser,
							},
							registrar: NexusRegistrars.Bloxlink,
						} as Component2CacheData,
						{
							expiry: 15 * 60,
						}
					);

					// TODO: redesign succcess message, a cleaner approach may be disabling the original message's components and using followups
					await interaction.edit({
						content:
							"<:userSearch:1211018578539581500> **A linked Bloxlink account has been found.**\nPlease confirm this is the correct account before proceeding.\n" +
							JSON.stringify(robloxUser),
						components: [
							{
								type: MessageComponentTypes.ActionRow,
								components: [
									{
										type: MessageComponentTypes.SelectMenu,
										customId: "@()#USKCJVD@*(H#RASD",
										options: [
											{
												label: "@" + robloxUser.name,
												value: "QUDIF(*@#UANFALKDJ",
												default: true,
											},
										],
										disabled: true,
									},
								],
							},
							{
								type: MessageComponentTypes.ActionRow,
								components: [component1.data, component2.data],
							},
						],
					});
					break;
				}
				case NexusRegistrarLabels.Nexus: {
					// TODO: check whether user is already registered with Nexus
					break;
				}
			}
		} catch (error) {
			if (!interaction.acknowledged) await interaction.respond("ERROR", { isPrivate: true });
			if (error instanceof SystemError) {
				console.log("systemError [- selectRegistrar]: ", error);
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
