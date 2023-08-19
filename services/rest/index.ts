import "dotenv/config";
import { createRestManager } from "@discordeno/rest";

export default createRestManager({
	token: process.env.TOKEN
});
