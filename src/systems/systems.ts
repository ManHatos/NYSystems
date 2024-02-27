import "dotenv/config";
import { SystemElements, MainSystemManagerDefaults, MainSystemManager } from "./types.js";

function systemDefaults<K extends keyof SystemElements>(type: K): MainSystemManagerDefaults<K> {
	return {
		get(id) {
			return this.data.filter((element) => element.id == id)[0] ?? undefined;
		},
		has(id) {
			if (!id) return false;
			return this.data.find((element) => element.id == id) ? true : false;
		},
		data: [],
	};
}

/** the main modules manager, includes all module elements based on their type */
export const systems = {
	set(system) {
		if (system.autocomplete) this.autocomplete.data.push(...system.autocomplete);
		if (system.components) this.components.data.push(...system.components);
		if (system.commands) this.commands.data.push(...system.commands);
		if (system.modals) this.modals.data.push(...system.modals);
	},
	autocomplete: systemDefaults("autocomplete"),
	components: systemDefaults("components"),
	commands: systemDefaults("commands"),
	modals: systemDefaults("modals"),
} as MainSystemManager;

import * as sentinel from "./sentinel/manager.js";
systems.set(sentinel);

import * as nexus from "./nexus/manager.js";
systems.set(nexus);
