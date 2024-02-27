import { MessageComponentTypes, MessageFlags, SelectMenuComponent } from "@discordeno/bot";
import { SystemError } from "../../../helpers/errors.js";
import { SystemComponentElement, SystemComponentIdentifiers } from "../../types.js";
import { UsersSingle } from "../../../services/roblox/users.js";
import { NexusNameOptions } from "../types.js";

export const id = SystemComponentIdentifiers.NEXUS_SELECT_NAME;
const component = {
	id,
	data: {
		customId: id,
		type: MessageComponentTypes.SelectMenu,
		options: [
			{
				label: "@username",
				description: "Your Roblox Username (default)",
				value: NexusNameOptions.RobloxName,
				// emoji: {
				//  TODO: add emoji
				// },
				default: true,
			},
			{
				label: "displayName",
				description: "Your Roblox Display Name",
				value: NexusNameOptions.RobloxDisplay,
				// emoji: {
				//  TODO: add emoji
				// },
			},
			{
				label: "Other",
				description: "Choose a custom name",
				value: NexusNameOptions.Custom,
			},
		],
		placeholder: "Choose your name",
	},
	async execute(interaction, values: [NexusNameOptions]) {
		await interaction.defer();
		try {
			await interaction.edit("TBD");

			// if (!interaction.message) return;

			// const userAccount = await nexus.users.find({
			// 	discord: interaction.user.id,
			// });

			// switch (values[0]) {
			// 	case NexusNameOptions.RobloxName: {
			// 		// ...
			// 	}
			// }
		} catch (error) {
			if (!interaction.acknowledged) await interaction.respond("ERROR", { isPrivate: true });
			if (error instanceof SystemError) {
				console.log("systemError [- selectName]: ", error);
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
export default component;

export const get = (user: Pick<UsersSingle, "name" | "displayName">): typeof component.data => {
	const cloned = { ...component.data } as SelectMenuComponent;
	cloned.options.map((option) => {
		switch (option.value as NexusNameOptions) {
			case NexusNameOptions.RobloxName: {
				return {
					...option,
					label: "@" + user.name,
				};
			}
			case NexusNameOptions.RobloxDisplay: {
				return {
					...option,
					label: user.displayName,
				};
			}
			default: {
				return option;
			}
		}
	});
	return cloned;
};
