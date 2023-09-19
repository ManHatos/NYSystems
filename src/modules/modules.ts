import {
	MainModuleManager,
	MainModuleManagerSharedFunctions,
	ModuleElementTypes,
} from "./types.js";

function moduleTypeFunctions<K extends keyof ModuleElementTypes>(
	type: K
): MainModuleManagerSharedFunctions<K> {
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
export const modules = {
	set(module) {
		if (module.autocomplete) this.autocomplete.data.push(...module.autocomplete);
		if (module.components) this.components.data.push(...module.components);
		if (module.commands) this.commands.data.push(...module.commands);
	},
	autocomplete: moduleTypeFunctions("autocomplete"),
	components: moduleTypeFunctions("components"),
	commands: moduleTypeFunctions("commands"),
} as MainModuleManager;

import * as moderation from "./moderation/manager.js";
modules.set(moderation);
