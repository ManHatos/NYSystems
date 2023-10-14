/** replace all characters in a string after provided `limit` (index from 1) and optionally replaces the excess with a string (default) */
export const limitString = (string: string, limit: number, replaceWith: string = "...") => {
	return string.replace(RegExp(`(?<=.{${limit}}).+`), replaceWith);
};

/** covnert an object into a usable `custom_id` for message components and other uses, `id` **must not** contain `%` */
export const convertCID = (
	id: string,
	data: Record<string, string | number>,
	length: number = 100
): string => {
	const returned = id + "%" + JSON.stringify(data).replaceAll(/^\{|\}$/g, "");
	if (returned.length > length || id.includes("%")) throw new Error("input too long or invalid");
	return returned;
};

/** retrieve the original object from a converted `custom_id` */
export const parseCID = (input: string): { id: string; data: Record<string, string | number> } => {
	try {
		const separatorIndex = input.indexOf("%");
		return {
			id: input.substring(0, separatorIndex),
			data: JSON.parse(`{${input.substring(separatorIndex + 1)}}`),
		};
	} catch (error) {
		throw new Error("invalid input");
	}
};
