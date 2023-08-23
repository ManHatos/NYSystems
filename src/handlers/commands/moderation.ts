import { ApplicationCommandOptionTypes, CreateApplicationCommand } from "@discordeno/bot";

export const moderate = {
	name: "moderate",
	description: "Moderate a Roblox user",
	options: [
		{
			type: ApplicationCommandOptionTypes.String,
			name: "username",
			description: "The user's Roblox username or identifier (ID)",
			required: true,
			autocomplete: true,
		},
		{
			type: ApplicationCommandOptionTypes.String,
			name: "reason",
			description: "The reason for the moderation",
			required: true,
		},
		{
			type: ApplicationCommandOptionTypes.String,
			name: "action",
			description: "The action taken on the user",
			required: true,
		},
	],
} as CreateApplicationCommand;

export const moderations = {
	name: "moderations",
	description: "View a Roblox user's moderations",
	options: [
		{
			type: ApplicationCommandOptionTypes.String,
			name: "username",
			description: "The user's Roblox username or identifier (ID)",
			required: true,
			autocomplete: true,
		},
	],
} as CreateApplicationCommand;
