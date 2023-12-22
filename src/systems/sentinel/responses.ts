import "dotenv/config";
import { DiscordEmbedField, MessageComponentTypes, User, avatarUrl } from "@discordeno/bot";
import { Embeds, ResponseIdentifiers, SystemComponentElement, SystemResponse } from "../systems.js";
import component1 from "./components/confirmRecord.js";
import component2 from "./components/confirmBanRequest.js";
import { UsersAvatar, UsersSingle } from "../../services/roblox/users.js";
import { BanRequest, BanRequestStates, RecordActions } from "../../services/datastore.js";
import { BanRequests, Records } from "@prisma/client";
import color from "chalk";

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
		history: {
			records: Partial<Records[]>;
			banRequests?: BanRequests;
		};
	};
	[ResponseIdentifiers.MODERATION_BR_CREATE_CONFIRM]: {
		author: User;
		roblox: {
			user: UsersSingle;
			avatar?: UsersAvatar["imageUrl"];
		};
		input: {
			reason: string;
			state: BanRequestStates;
		};
		history: Partial<Records[]>;
	};
	[ResponseIdentifiers.MODERATION_CREATED_SUCCESS]: void;
	[ResponseIdentifiers.MODERATION_CREATE_CONFIRM_UPDATE]: SystemComponentElement["data"];
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
	[ResponseIdentifiers.MODERATION_BAN_REQUEST]: {
		author: User;
		roblox: {
			user: UsersSingle;
			avatar?: UsersAvatar["imageUrl"];
		};
		input: {
			reason: string;
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
		history: {
			records: Partial<Records[]>;
			banRequests?: BanRequests;
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
								name: "Roblox",
								value: formatRobloxUser(data.roblox.user.name, data.roblox.user.id),
							},
							{
								name: "Reason",
								value: "```ansi\n" + color.white(data.input.reason) + "\n```",
							},
							{
								name: "Action",
								value: "```ansi\n" + formatAction(data.input.action!) + "\n```",
								inline: true,
							},
							{
								name: "Warnings",
								value: "```ansi\n" + color.white(data.input.warningCount) + "\n```",
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
	[ResponseIdentifiers.MODERATION_BR_CREATE_CONFIRM](data) {
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
						description: `## [User Ban Request Preview](https://roblox.com/users/${data.roblox.user.id})\n:warning: **This ban request has not been saved yet**\nPlease verify the entered information to confirm`,
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
								value: "```ansi\n" + color.white(data.input.reason) + "\n```",
							},
							{
								name: "Action",
								value: "```ansi\n" + formatAction("Ban Request") + "\n```",
								inline: true,
							},
							{
								name: "Status",
								value: "```ansi\n" + formatBanRequestState(data.input.state) + "\n```",
								inline: true,
							},
							...formatHistory({ records: data.history }),
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
					components: [component2.data],
				},
			],
		};
	},
	[ResponseIdentifiers.MODERATION_CREATED_SUCCESS]() {
		return {
			content: process.env.EMOJI_SUCCESS + " **Successfully submitted**",
		};
	},
	[ResponseIdentifiers.MODERATION_CREATE_CONFIRM_UPDATE](data) {
		return {
			components: [
				{
					type: MessageComponentTypes.ActionRow,
					components: [{ ...data, disabled: true }],
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
								value: "```ansi\n" + color.white(data.input.reason) + "\n```",
							},
							{
								name: "Action",
								value: "```ansi\n" + formatAction(data.input.action!) + "\n```",
								inline: true,
							},
							{
								name: "Warnings",
								value: "```ansi\n" + color.white(data.input.warningCount) + "\n```",
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
				//  TODO: add component(s) to manage records
			],
		};
	},
	[ResponseIdentifiers.MODERATION_BAN_REQUEST](data) {
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
						description: `## [Ban Request](https://roblox.com/users/${data.roblox.user.id})`,
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
								value: "```ansi\n" + color.white(data.input.reason) + "\n```",
							},
							{
								name: "Status",
								value: "```ansi\n" + formatBanRequestState(BanRequestStates.Pending) + "\n```",
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
				//  TODO: add component(s) to manage ban requests
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
								color.white("Last Week") +
								"   " +
								color.black(data.warnings.week) +
								"\n" +
								color.white("Last Month") +
								"  " +
								color.black(data.warnings.month) +
								"\n" +
								color.white("All-time") +
								"    " +
								color.black(data.warnings.total) +
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
		color.black("@") +
		color.white(name) +
		"\n``````ansi\n" +
		color.black("#") +
		color.white(id) +
		"\n```" +
		(details?.description
			? (details.description.length == 0
					? "```ansi\n" + color.yellow("no user description")
					: "```txt\n" + details.description) + "\n```"
			: "")
	);
}

function formatAction(type: RecordActions | BanRequest): string {
	switch (type) {
		case RecordActions.Ban: {
			return color.red(RecordActions[type]);
		}
		case RecordActions.Kick: {
			return color.yellow(RecordActions[type]);
		}
		case RecordActions.Warning: {
			return color.cyan(RecordActions[type]);
		}
		case "Ban Request": {
			return color.red(type);
		}
	}
}

function formatBanRequestState(state: BanRequestStates): string {
	switch (state) {
		case BanRequestStates.Pending: {
			return color.red(BanRequestStates[state]);
		}
		case BanRequestStates.Rejected: {
			return color.yellow(BanRequestStates[state]);
		}
		case BanRequestStates.Approved: {
			return color.green(BanRequestStates[state]);
		}
	}
}

function formatHistory(
	history: { records: Partial<Records[]>; banRequest?: BanRequests },
	options: {
		limit: number;
	} = {
		limit: 3,
	}
): DiscordEmbedField[] {
	if (history.records.length < 1 && !history.banRequest)
		return [
			{
				name: "**History**",
				value: ":mag: *no user history found*",
			},
		];

	const fields: DiscordEmbedField[] = [
		{
			name: "**History**",
			value: "** **",
		},
	];
	if (history.banRequest) {
		fields.push({
			name: `\` ⚠️ \` https://discord.com/channels/${process.env.DISCORD_GUILD}/${process.env.SENTINEL_BR_CHANNEL_ID}/${history.banRequest.id}`,
			value:
				"**Created <t:" +
				(+new Date(history.banRequest.createdAt) / 1000).toFixed(0) +
				":R>**\nby <@" +
				history.banRequest.author.id +
				">\n```ansi\n" +
				color.white("Reason  ") +
				color.black(history.banRequest.input.reason) +
				"\n``````ansi\n" +
				color.white("Status  ") +
				formatBanRequestState(history.banRequest.state) +
				"\n```",
		});

		if (history.records.length > 0)
			fields.push({
				name: "** **",
				value: "** **",
			});
	}

	let count = 1;
	history.records.splice(options.limit);
	history.records.forEach((record, index, array) => {
		if (!record) return;
		fields.push({
			name: `\` ${count++} \` https://discord.com/channels/${process.env.DISCORD_GUILD}/${
				process.env.SENTINEL_CHANNEL_ID
			}/${record.id}`,
			value:
				"**Created <t:" +
				(+new Date(record.createdAt) / 1000).toFixed(0) +
				":R>**\nby <@" +
				record.author.id +
				">\n```ansi\n" +
				color.white("Reason  ") +
				color.black(record.input.reason) +
				"\n``````ansi\n" +
				color.white("Action  ") +
				formatAction(record.input.action) +
				"\n```",
		});
		if (index + 1 < array.length)
			fields.push({
				name: "** **",
				value: "** **",
			});
	});
	return fields;
}
