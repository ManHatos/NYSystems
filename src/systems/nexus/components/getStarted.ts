import {
	MessageComponentTypes,
	ButtonStyles,
	MessageFlags,
	InteractionResponseTypes,
	ButtonComponent,
} from "@discordeno/bot";
import { SystemComponentElement, SystemComponentIdentifiers } from "../../types.js";
import { ErrorCodes, SystemError } from "../../../helpers/errors.js";
import { discord } from "../../../services/discord.js";
import { nexus } from "../../../helpers/nexus.js";
import component1 from "./selectRegistrar.js";

export const id = SystemComponentIdentifiers.NEXUS_START;
export default {
	id,
	data: {
		customId: id,
		type: MessageComponentTypes.Button,
		// emoji: {
		// 	TODO: add emoji
		// },
		label: "Get Started",
		style: ButtonStyles.Primary,
	},
	async execute(interaction) {
		await discord.rest.sendInteractionResponse(interaction.id, interaction.token, {
			type: InteractionResponseTypes.DeferredChannelMessageWithSource,
			data: {
				flags: MessageFlags.Ephemeral,
			},
		});

		try {
			const userAccount = await nexus.users
				.find({
					discord: interaction.user.id,
				})
				.catch((error) => {
					if (error instanceof SystemError && error.code == ErrorCodes.NEXUS_USER_NOT_FOUND) return;
					else throw error;
				});

			if (userAccount) {
				// TODO: skip onboarding
				await interaction.edit("you have an existing account");
			} else if (false) {
				// TODO: check whether link data exists in cache and resume onboarding
			} else {
				await interaction.edit({
					content: `<a:wave_animated:1169433259747319930> Welcome to **<:NYS:1142466344487493743> New York State Roleplay**, <@${interaction.user.id}>!\n\n... in order to access our community server, you need to register an account with our systems.\nThis involves *linking* your Discord and Roblox accounts so we know who you are.\n\nThere are 2 ways to finish registration...\n1. using an existing [Bloxlink account](https://www.blox.link/).\n2. creating a new account using our **Nexus** systems.\n\n## :link: Choose a method below to continue`,
					components: [
						{
							type: MessageComponentTypes.ActionRow,
							components: [component1.data],
						},
					],
				});
			}
		} catch (error) {
			if (!interaction.acknowledged) await interaction.respond("ERROR", { isPrivate: true });
			if (error instanceof SystemError) {
				console.log("systemError [getStarted]: ", error);
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
