import { consola } from "consola";

consola.level = process.env.NODE_ENV === "production" ? 3 : 4;

export const logger = consola;
export const geminiLog = consola.withTag("gemini");
