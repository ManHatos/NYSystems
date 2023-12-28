import { BanRequestStates, RecordActions, datastore } from "../../../services/datastore.js";
import { SystemRID, SystemCommandElement, SystemCommandIdentifiers } from "../../types.js";
import autocomplete from "../autocomplete/user.js";
import { response } from "../responses.js";
import { roblox } from "../../../services/roblox.js";
import { UsersAvatar, UsersAvatarStates } from "../../../services/roblox/users.js";
import { ApplicationCommandOptionTypes, MessageFlags } from "@discordeno/bot";
import { dateFromDays, extractUserAutocompleteID } from "../../../helpers/utility.js";
import { SystemError } from "../../../helpers/errors.js";

export const id = SystemCommandIdentifiers.SENTINEL_HISTORY_VIEW;
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

		try {
			const robloxUser = await roblox.users.single(
				extractUserAutocompleteID(values[0]) || values[0]
			);
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
						})
						.catch((error) => {
							console.error(error);
							return undefined;
						});
				}
				return requestAvatar();
			})();

			const userWarnings = await datastore.records.findMany({
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
			const userRecords = await datastore.records.findMany({
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
			});
			const banRequests = await datastore.banRequests.findMany({
				where: {
					input: {
						is: {
							user: {
								id: robloxUser.id,
							},
						},
					},
					state: BanRequestStates.Pending,
				},
			});

			await interaction.edit(
				response[SystemRID.SENTINEL_LOOKUP]({
					author: interaction.user,
					roblox: {
						user: robloxUser,
						avatar: robloxAvatar,
					},
					warnings: {
						week: userWarnings.filter((record) => +record.createdAt >= +dateFromDays(7)).length,
						month: userWarnings.filter((record) => +record.createdAt >= +dateFromDays(30)).length,
						total: userWarnings.length,
					},
					history: {
						records: userRecords,
						banRequests: banRequests[0],
					},
				})
			);
		} catch (error) {
			if (!interaction.acknowledged) await interaction.respond("ERROR", { isPrivate: true });
			if (error instanceof SystemError) {
				console.log("systemError /lookup: ", error);
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
} as SystemCommandElement;
