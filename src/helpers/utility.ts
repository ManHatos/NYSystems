/** replace all characters in a string after provided `limit` (index from 1) and optionally replaces the excess with a string (default) */
export const limitString = (string: string, limit: number, replaceWith: string = "...") => {
	return string.replace(RegExp(`(?<=.{${limit}}).+`), replaceWith);
};
