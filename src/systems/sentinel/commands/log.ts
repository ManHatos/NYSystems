import "dotenv/config";
import {
	ResponseIdentifiers,
	SystemCommandElement,
	SystemCommandIdentifiers,
} from "../../systems.js";
import { ApplicationCommandOptionTypes } from "@discordeno/bot";
import { RecordActions, datastore } from "../../../services/datastore.js";
import autocomplete1 from "../autocomplete/user.js";
import { response } from "../responses.js";
import { roblox } from "../../../services/roblox.js";
import { UsersAvatar } from "../../../services/roblox/users.js";

export const id = SystemCommandIdentifiers.MODERATION_CREATE_NEW;
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
				type: ApplicationCommandOptionTypes.Integer,
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
	async execute(interaction, values: [string, string, number]) {
		const userRecords = await datastore.records.findMany({
			where: {
				author: {
					id: interaction.user.id,
				},
			},
		});

		console.log(values);

		const robloxUser = await roblox.users.single(
			values[0].startsWith("::")
				? Number(values[0].replace(process.env.SENTINEL_USER_AUTOCOMPLETE_PREFIX, ""))
				: values[0]
		);
		const robloxAvatar = await (async () => {
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
		})();

		await interaction.respond(
			response[ResponseIdentifiers.MODERATION_CREATE_CONFIRM]({
				author: interaction.user,
				history: userRecords,
				input: {
					reason: values[1],
					action: values[2],
					warningCount: userRecords.filter((record) => record.input.action == RecordActions.Warning)
						.length,
				},
				roblox: {
					user: robloxUser,
					avatar: robloxAvatar,
				},
			}),
			{ isPrivate: true }
		);
	},
} as SystemCommandElement;
