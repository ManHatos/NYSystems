import chalk from "chalk";

const color = {
	info: (message: string) => {
		return chalk.gray(message);
	},
	warn: (message: string) => {
		return chalk.hex("#FFCC00").bold(message);
	},
	error: (message: string) => {
		return chalk.hex("CC3300").bold(message);
	},
};

export const log = {
	info: (message: string): void => logTemplate("info", message),
	warn: (message: string): void => logTemplate("warn", message),
	error: (message: string): void => logTemplate("error", message),
};

function logTemplate(level: "info" | "warn" | "error" = "info", message: string) {
	const logMessage = new Date().toISOString() + ` [${level.toUpperCase()}] ` + message;

	console.log(color[level](logMessage));
}
