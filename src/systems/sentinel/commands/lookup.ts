import { RecordActions, datastore } from "../../../services/datastore.js";
import {
	ResponseIdentifiers,
	SystemCommandElement,
	SystemCommandIdentifiers,
} from "../../systems.js";
import autocomplete from "../autocomplete/user.js";
import { response } from "../responses.js";
import { roblox } from "../../../services/roblox.js";
import { UsersAvatar, UsersAvatarStates } from "../../../services/roblox/users.js";
import { ApplicationCommandOptionTypes } from "@discordeno/bot";
import { dateFromDays, extractUserAutocompleteID } from "../../../helpers/utility.js";

export const id = SystemCommandIdentifiers.MODERATION_HISTORY_VIEW;
export default {
	id,
	data: {
		name: id,
		description: "View a Roblox user's information and record history",
		options: [
			autocomplete.data,
			{
				type: ApplicationCommandOptionTypes.Integer,
				name: "before",
				description: "Show only records created before this number of days",
				required: false,
				minValue: 1,
				maxValue: 365,
			},
		],
	},
	async execute(interaction, values: [string, number]) {
		await interaction.defer(true);

		const robloxUser = await roblox.users.single(extractUserAutocompleteID(values[0]) || values[0]);
		const robloxAvatar = await (async () => {
			async function requestAvatar(
				retried?: boolean
			): Promise<UsersAvatar["imageUrl"] | undefined> {
				return await roblox.users.avatars
					.full([robloxUser.id], { size: "720x720" })
					.then(async (avatar) => {
						if (avatar[0]?.state == UsersAvatarStates.Completed) {
							return avatar[0]?.imageUrl;
						} else if (
							!retried &&
							(avatar[0]?.state == UsersAvatarStates.Pending ||
								avatar[0]?.state == UsersAvatarStates.TemporarilyUnavailable ||
								avatar[0]?.state == UsersAvatarStates.Error)
						) {
							console.error("roblox avatar not ready");
							return await requestAvatar(true);
						}
					});
			}
			return requestAvatar();
		})();

		const warnings = await datastore.records.findMany({
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
		});

		await datastore.records
			.findMany({
				where: {
					input: {
						is: {
							user: {
								id: robloxUser.id,
							},
						},
					},
					createdAt: {
						lt: dateFromDays(values[1] ?? 0, { pastOnly: true }),
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			})
			.then(async (records) => {
				await interaction.edit(
					response[ResponseIdentifiers.MODERATION_HISTORY_LOOKUP]({
						author: interaction.user,
						roblox: {
							user: robloxUser,
							avatar: robloxAvatar,
						},
						warnings: {
							week: warnings.filter((record) => +record.createdAt >= +dateFromDays(7)).length,
							month: warnings.filter((record) => +record.createdAt >= +dateFromDays(30)).length,
							total: warnings.length,
						},
						history: records,
					})
				);
			})
			.catch(async (error) => {
				console.error("db record find failed: ", error);
				await interaction.edit("error4");
			});
	},
} as SystemCommandElement;
