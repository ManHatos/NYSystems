import "dotenv/config";
import { DiscordEmbedField, MessageComponentTypes, User, avatarUrl } from "@discordeno/bot";
import { Embeds, ResponseIdentifiers, SystemResponse } from "../systems.js";
import component1 from "./components/confirmLog.js";
import { UsersAvatar, UsersSingle } from "../../services/roblox/users.js";
import { RecordActions } from "../../services/datastore.js";
import { Records } from "@prisma/client";
import chalk from "chalk";

export const response: SystemResponse<{
	[ResponseIdentifiers.MODERATION_CREATE_CONFIRM]: {
		author: User;
		roblox: {
			user: UsersSingle;
			avatar?: UsersAvatar["imageUrl"];
		};
		input: {
			reason: string;
			action: RecordActions;
			warningCount: number;
		};
		history: Partial<Records[]>;
	};
	[ResponseIdentifiers.MODERATION_CREATED_SUCCESS]: void;
	[ResponseIdentifiers.MODERATION_CREATE_CONFIRM_UPDATE]: void;
	[ResponseIdentifiers.MODERATION_RECORD_CREATE]: {
		author: User;
		roblox: {
			user: UsersSingle;
			avatar?: UsersAvatar["imageUrl"];
		};
		input: {
			reason: string;
			action: RecordActions;
			warningCount: number;
		};
	};
}> = {
	[ResponseIdentifiers.MODERATION_CREATE_CONFIRM](data) {
		return {
			embeds: Embeds(
				[
					{
						author: {
							name: "@" + data.author.username,
							iconUrl: avatarUrl(data.author.id!, data.author.discriminator ?? "0", {
								avatar: data.author.avatar ?? undefined,
							}),
						},
						description: `## [User Record Preview](https://roblox.com/users/${data.roblox.user.id})\n:warning: **This record has not been saved yet**\nPlease verify the entered information to confirm`,
						thumbnail: {
							url: data.roblox.avatar ?? process.env.URI_AVATAR_LOAD_ERROR,
						},
						fields: [
							{
								name: "User",
								value:
									"```ansi\n" +
									chalk.black("@") +
									chalk.white(data.roblox.user.name) +
									"\n``````ansi\n" +
									chalk.black("#") +
									chalk.white(data.roblox.user.id) +
									"\n```",
								inline: true,
							},
							{
								name: "Reason",
								value: "```ansi\n" + chalk.white(data.input.reason) + "\n```",
							},
							{
								name: "Action",
								value: "```ansi\n" + formatAction(data.input.action!) + "\n```",
								inline: true,
							},
							{
								name: "Warnings",
								value: "```ansi\n" + chalk.white(data.input.warningCount) + "\n```",
								inline: true,
							},
							{
								name: "**Recent Records**",
								value: data.history.length < 1 ? ":mag: *no record history found*" : "** **",
							},
							...((history) => {
								let fields: DiscordEmbedField[] = [];
								let count = 1;

								history.splice(5); // limit array length
								history.forEach((record, index, array) => {
									if (!record || index >= 5) return;
									fields.push({
										name: `\` ${count++} \` https://discord.com/channels/${
											process.env.DISCORD_GUILD
										}/${process.env.SENTINEL_CHANNEL}/${record.id}`,
										value:
											"**Created <t:" +
											(new Date(record.createdAt).getTime() / 1000).toFixed(0) +
											":R>**```ansi\n" +
											chalk.white("Reason  ") +
											chalk.black(record.input.reason) +
											"\n``````ansi\n" +
											chalk.white("Action  ") +
											formatAction(record.input.action) +
											"\n```",
									});
									if (index + 1 != array.length)
										fields.push({
											name: "** **",
											value: "** **",
										});
								});
								return fields;
							})(data.history),
						],
					},
				],
				{
					color: Number(process.env.SENTINEL_EMBED_COLOR_PREVIEW),
				}
			),
			components: [
				{
					type: MessageComponentTypes.ActionRow,
					components: [component1.data],
				},
			],
		};
	},
	[ResponseIdentifiers.MODERATION_CREATED_SUCCESS]() {
		return {
			content: "your record has been created successfully",
		};
	},
	[ResponseIdentifiers.MODERATION_CREATE_CONFIRM_UPDATE]() {
		return {
			components: [
				{
					type: MessageComponentTypes.ActionRow,
					components: [
						Object.assign(component1.data, {
							disabled: true,
						}),
					],
				},
			],
		};
	},
	[ResponseIdentifiers.MODERATION_RECORD_CREATE](data) {
		return {
			embeds: Embeds(
				[
					{
						author: {
							name: "@" + data.author.username,
							iconUrl: avatarUrl(data.author.id!, data.author.discriminator ?? "0", {
								avatar: data.author.avatar ?? undefined,
							}),
						},
						description: `## [User Record](https://roblox.com/users/${data.roblox.user.id})`,
						thumbnail: {
							url: data.roblox.avatar ?? process.env.URI_AVATAR_LOAD_ERROR,
						},
						fields: [
							{
								name: "User",
								value:
									"```ansi\n" +
									chalk.black("@") +
									chalk.white(data.roblox.user.name) +
									"\n``````ansi\n" +
									chalk.black("#") +
									chalk.white(data.roblox.user.id) +
									"\n```",
								inline: true,
							},
							{
								name: "Reason",
								value: "```ansi\n" + chalk.white(data.input.reason) + "\n```",
							},
							{
								name: "Action",
								value: "```ansi\n" + formatAction(data.input.action!) + "\n```",
								inline: true,
							},
							{
								name: "Warnings",
								value: "```ansi\n" + chalk.white(data.input.warningCount) + "\n```",
								inline: true,
							},
						],
					},
				],
				{
					color: Number(process.env.SENTINEL_EMBED_COLOR_PRIMARY),
				}
			),
			components: [
				// TODO: add component(s) to manage records
				{
					type: MessageComponentTypes.ActionRow,
					components: [component1.data],
				},
			],
		};
	},
};

function formatAction(type: RecordActions): string {
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
}
