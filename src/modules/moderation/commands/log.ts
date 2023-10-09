import "dotenv/config";
import {
	ModuleAutocompleteIdentifiers,
	ModuleCommandElement,
	ModuleCommandIdentifiers,
} from "../../modules.js";
import { ApplicationCommandOptionTypes, InteractionDataOption, avatarUrl } from "@discordeno/bot";
import { RecordActions, datastore } from "../../../services/datastore.js";
import { roblox } from "../../../services/roblox.js";
import { UsersAvatar } from "../../../services/roblox/users.js";
import autocomplete1 from "../autocomplete/user.js";
import chalk from "chalk";

export const id = ModuleCommandIdentifiers.MODERATION_CREATE_NEW;
export default {
	id,
	data: {
		name: id,
		description: "Moderate a Roblox user",
		options: [
			autocomplete1.data,
			{
				type: ApplicationCommandOptionTypes.String,
				name: "reason",
				description: "The reason for the moderation",
				required: true,
				maxLength: 100,
			},
			{
				type: ApplicationCommandOptionTypes.String,
				name: "action",
				description: "The action taken on the user",
				required: true,
				choices: Object.keys(RecordActions)
					.filter((key) => isNaN(Number(key)))
					.map((action) => ({
						name: action,
						value: String(RecordActions[action as keyof typeof RecordActions]),
					})),
			},
		],
	},
	async execute(interaction) {
		await interaction.defer(true);

		if (!interaction.data?.options) return await interaction.edit("error2");
		const options: Record<string, InteractionDataOption> = {};
		interaction.data.options.forEach((option) => {
			options[option.name] = option;
		});

		const commandOptionNames = this.data.options!.map((option) => option.name);
		if (!Object.keys(options).every((option) => commandOptionNames.includes(option)))
			return await interaction.edit("error1");

		if (
			typeof options[ModuleAutocompleteIdentifiers.MODERATION_USER]?.value != "string" ||
			typeof options.reason?.value != "string" ||
			typeof options.action?.value != "string"
		)
			return;
		const input = {
			user: options[ModuleAutocompleteIdentifiers.MODERATION_USER].value,
			reason: options.reason.value,
			action: Number(options.action.value) as RecordActions,
		};
		if (!RecordActions[input.action]) return await interaction.edit("error8");

		roblox.users
			.single(input.user.startsWith("::") ? Number(input.user.split("::")[1]) : input.user)
			.then(async (robloxUser) => {
				const warningsCount =
					(await datastore.records
						.count({
							where: {
								input: {
									is: {
										user: {
											id: robloxUser.id,
										},
										action: RecordActions.Warning,
									},
								},
							},
						})
						.catch(console.error)) ?? 0;

				const robloxUserAvatarFull =
					(await (async () => {
						async function requestAvatar(
							retried?: boolean
						): Promise<UsersAvatar["imageUrl"] | undefined> {
							return await roblox.users.avatars
								.full([robloxUser.id], "720x720")
								.then(async (avatar) => {
									if (avatar[0]?.state == "Completed") {
										return avatar[0]?.imageUrl;
									} else if (
										!retried &&
										(avatar[0]?.state == "Pending" ||
											avatar[0]?.state == "TemporarilyUnavailable" ||
											avatar[0]?.state == "Error")
									) {
										console.error("roblox avatar not ready");
										return await requestAvatar(true);
									}
								})
								.catch((reason) => {
									console.error(reason);
									return undefined;
								});
						}
						return requestAvatar();
					})()) ?? process.env.URI_AVATAR_LOAD_ERROR;

				await interaction.bot.rest
					.executeWebhook(process.env.SENTINEL_WEBHOOK_ID, process.env.SENTINEL_WEBHOOK_TOKEN, {
						// username: '', TODO: support for webhook custom profiles
						// avatarUrl: '',
						wait: true,
						embeds: [
							{
								author: {
									name: "by @" + interaction.user.username,
									url: "https://discord.com/users/" + interaction.user.id,
									iconUrl: avatarUrl(interaction.user.id, interaction.user.discriminator, {
										avatar: interaction.user.avatar,
									}),
								},
								description: `## [User Record](https://roblox.com/users/${robloxUser.id} 'Visit Roblox profile')`,
								color: 2829617,
								fields: [
									{
										name: "User",
										value:
											"```ansi\n" +
											chalk.black("@") +
											chalk.white(robloxUser.name) +
											"\n``````ansi\n" +
											chalk.black("#") +
											chalk.white(robloxUser.id) +
											"\n```",
										inline: true,
									},
									{
										name: "Reason",
										value: "```ansi\n" + chalk.white(input.reason) + "\n```",
									},
									{
										name: "Action",
										value:
											"```ansi\n" +
											((type: RecordActions) => {
												switch (type) {
													case RecordActions.Ban: {
														return chalk.red(RecordActions[type]);
													}
													case RecordActions.Kick: {
														return chalk.yellow(RecordActions[type]);
													}
													case RecordActions.Warning: {
														return chalk.cyan(RecordActions[type]);
													}
												}
											})(input.action) +
											"\n```",
										inline: true,
									},
									{
										name: "Warnings",
										value:
											"```ansi\n" +
											chalk.black("#") +
											chalk.white(
												input.action == RecordActions.Warning ? warningsCount + 1 : warningsCount
											) +
											"\n```",
										inline: true,
									},
								],
								timestamp: new Date().toISOString(),
								image: {
									url: process.env.URI_EMBED_WIDTH_LIMITER,
								},
								thumbnail: {
									url: robloxUserAvatarFull,
								},
							},
						],
					})
					.then(async (message) => {
						if (!message) return await interaction.edit("error214");
						await datastore.records
							.create({
								data: {
									id: String(message.id),
									author: {
										id: String(interaction.user.id),
									},
									input: {
										user: {
											id: robloxUser.id,
										},
										reason: input.reason,
										action: input.action,
									},
								},
							})
							.then(async () => {
								await interaction.edit("success");
							})
							.catch(async (error) => {
								console.error("db record create failed: ", error);
								await interaction.edit("error4");
							});
					})
					.catch(async (error) => {
						console.error("log message create failed: ", error);
						await interaction.edit("error231");
					});
			})
			.catch(async (e) => {
				console.log("user specific request error: ", e);
				await interaction.edit("error6");
			});
	},
} as ModuleCommandElement;
