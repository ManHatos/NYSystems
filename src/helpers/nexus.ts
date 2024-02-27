import "dotenv/config";
import { NexusRegistrationType, NexusRegistrars, datastore } from "../services/datastore.js";
import { User as DiscordUser } from "@discordeno/bot";
import { RobloxUser } from "../services/roblox/users.js";
import { ErrorCodes, ErrorLevels, SystemError } from "./errors.js";
import { User } from "@prisma/client";
import { RequireAtLeastOne, stringify } from "./utility.js";

/** interact with commonly used nexus datastore methods */
export const nexus = {
	/** interact with nexus user models */
	users: {
		/** register a new nexus user account */
		register: async function (
			name: string,
			registration: {
				type: NexusRegistrationType;
				registrar?: NexusRegistrars;
			},
			linked: {
				discord: DiscordUser["id"];
				roblox: RobloxUser["id"];
			}
		): Promise<User> {
			return new Promise(async (resolve, reject) => {
				try {
					const existingAccount = await datastore.user.findFirst({
						where: {
							OR: [
								{
									linked: {
										is: {
											roblox: linked.roblox,
										},
									},
								},
								{
									linked: {
										is: {
											discord: linked.discord,
										},
									},
								},
							],
						},
					});

					let userAccount = {} as User;
					if (existingAccount?.registration.type == NexusRegistrationType.Registered)
						throw new SystemError({
							code: ErrorCodes.NEXUS_USER_REGISTERED,
							message: `This user is already registered with Nexus.\<@${existingAccount.linked.discord}> is linked to (\`#${existingAccount.linked.roblox}\`)[https://roblox.com/users/${existingAccount.linked.roblox}/profile]\nContact support for help.`,
							level: ErrorLevels.User,
							cause: "User already exists with registered account: " + existingAccount.id,
						});
					else if (existingAccount?.registration.type == NexusRegistrationType.Guest) {
						userAccount = await datastore.user.update({
							where: {
								id: existingAccount.id,
							},
							data: {
								linked: {
									set: {
										discord: linked.discord,
										roblox: linked.roblox,
									},
								},
							},
						});
						console.log(
							`created link between Discord ${existingAccount.linked.discord} -- Roblox ${existingAccount.linked.roblox}`
						);
					} else {
						userAccount = await datastore.user.create({
							data: {
								name,
								registration,
								linked,
							},
						});
						console.log("successfully registered user " + userAccount.id);
					}
					resolve(userAccount);
				} catch (error) {
					reject(error);
				}
			});
		},
		/** search for a registered nexus user account */
		find: async function (query: UserQuery): Promise<User> {
			return new Promise(async (resolve, reject) => {
				try {
					const account = await datastore.user.findFirst({
						where: {
							OR: [
								{
									id: query.id ?? "",
								},
								{
									linked: {
										is: {
											discord: query.discord ?? 0n,
										},
									},
								},
								{
									linked: {
										is: {
											roblox: query.roblox ?? 0,
										},
									},
								},
							],
						},
					});

					if (!account)
						throw new SystemError({
							code: ErrorCodes.NEXUS_USER_NOT_FOUND,
							message: "This user is not registered with Nexus.",
							level: ErrorLevels.System,
							cause: "Query " + stringify(query) + " was not found",
						});

					resolve(account);
				} catch (error) {
					reject(error);
				}
			});
		},
		/** update an existing nexus user account, does not include managing the account (deletion, linked accounts and such) */
		update: async function (
			user: UserQuery,
			data: RequireAtLeastOne<Pick<User, "name" | "flags" | "note">>
		): Promise<User> {
			return new Promise(async (resolve, reject) => {
				try {
					const userAccount = await this.find(user);
					const updatedAccount = await datastore.user.update({
						where: {
							id: userAccount.id,
						},
						data: {
							name: {
								set: data.name ?? userAccount.name,
							},
							flags: {
								set: data.flags ?? userAccount.flags,
							},
							note: {
								set: data.note ?? userAccount.note,
							},
						},
					});

					resolve(updatedAccount);
				} catch (error) {
					reject(error);
				}
			});
		},
	},
};

// helpers typing

type UserQuery = RequireAtLeastOne<{
	discord: DiscordUser["id"];
	roblox: RobloxUser["id"];
	id: User["id"];
}>;
