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
	[ResponseIdentifiers.MODERATION_HISTORY_LOOKUP]: {
		author: User;
		roblox: {
			user: UsersSingle;
			avatar?: UsersAvatar["imageUrl"];
		};
		warnings: {
			week: number;
			month: number;
			total: number;
		};
		history: Partial<Records[]>;
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
								name: "Roblox",
								value: formatRobloxUser(data.roblox.user.name, data.roblox.user.id),
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
							...formatHistory(data.history),
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
								name: "Roblox",
								value: formatRobloxUser(data.roblox.user.name, data.roblox.user.id),
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
	[ResponseIdentifiers.MODERATION_HISTORY_LOOKUP](data) {
		return {
			embeds: Embeds([
				{
					author: {
						name: "@" + data.author.username,
						iconUrl: avatarUrl(data.author.id!, data.author.discriminator ?? "0", {
							avatar: data.author.avatar ?? undefined,
						}),
					},
					description: `## [User History & Information](https://roblox.com/users/${data.roblox.user.id})`,
					thumbnail: {
						url: data.roblox.avatar ?? process.env.URI_AVATAR_LOAD_ERROR,
					},
					fields: [
						{
							name: "Roblox",
							value: formatRobloxUser(data.roblox.user.name, data.roblox.user.id, {
								timestamp: data.roblox.user.created,
								description: data.roblox.user.description,
							}),
						},
						{
							name: "Warnings",
							value:
								"```ansi\n" +
								chalk.white("Last Week") +
								"   " +
								chalk.black(data.warnings.week) +
								"\n" +
								chalk.white("Last Month") +
								"  " +
								chalk.black(data.warnings.month) +
								"\n" +
								chalk.white("All-time") +
								"    " +
								chalk.black(data.warnings.total) +
								"\n```",
						},
						...formatHistory(data.history, {
							limit: 5,
						}),
					],
				},
			]),
		};
	},
};

function formatRobloxUser(
	name: UsersSingle["name"],
	id: UsersSingle["id"],
	details?: {
		timestamp: UsersSingle["created"];
		description: UsersSingle["description"];
	}
): string {
	return (
		(details?.timestamp
			? "Created <t:" + (Date.parse(details.timestamp) / 1000).toFixed() + ":R>\n"
			: "") +
		"```ansi\n" +
		chalk.black("@") +
		chalk.white(name) +
		"\n``````ansi\n" +
		chalk.black("#") +
		chalk.white(id) +
		"\n```" +
		(details?.description
			? (details.description.length == 0
					? "```ansi\n" + chalk.yellow("no user description")
					: "```txt\n" + details.description) + "\n```"
			: "")
	);
}

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

function formatHistory(
	history: Partial<Records[]>,
	options: {
		limit: number;
	} = {
		limit: 3,
	}
) {
	const fields: DiscordEmbedField[] = [
		{
			name: "**Record History**",
			value: history.length < 1 ? ":mag: *no record history found*" : "** **",
		},
	];
	let count = 1;

	history.splice(options.limit); // limit array length
	history.forEach((record, index, array) => {
		if (!record) return;
		fields.push({
			name: `\` ${count++} \` https://discord.com/channels/${process.env.DISCORD_GUILD}/${
				process.env.SENTINEL_CHANNEL
			}/${record.id}`,
			value:
				"**Created <t:" +
				(+new Date(record.createdAt) / 1000).toFixed(0) +
				":R>**\nby <@" +
				record.author.id +
				">\n```ansi\n" +
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
}
