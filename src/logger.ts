import { consola } from "consola";

consola.level = process.env.NODE_ENV === "production" ? 3 : 4;

export type StructuredLogLevel = "trace" | "debug" | "info" | "warn" | "error";
export type StructuredLogStatus = "idle" | "running" | "success" | "error";

export interface StructuredLogEvent {
  id?: string;
  timestamp?: string | number | Date;
  level: StructuredLogLevel;
  message: string;
  source: string;
  tags?: string[];
  sessionId?: string;
  requestId?: string;
  runId?: string;
  status?: StructuredLogStatus;
  metadata?: Record<string, unknown>;
}

export interface LoggerAdapter {
  log: (event: StructuredLogEvent) => void | Promise<void>;
}

function normalizeLegacyLogArguments(args: unknown[]) {
  const [firstArgument, ...restArguments] = args;
  const messageParts: string[] = [];
  const metadataParts: unknown[] = [];

  if (typeof firstArgument === "string") {
    messageParts.push(firstArgument);
  } else if (firstArgument !== undefined) {
    metadataParts.push(firstArgument);
  }

  for (const argument of restArguments) {
    if (typeof argument === "string") {
      messageParts.push(argument);
      continue;
    }

    metadataParts.push(argument);
  }

  return {
    message: messageParts.join(" ").trim() || (typeof firstArgument === "string" ? firstArgument : "Gemini event"),
    metadata:
      metadataParts.length === 0
        ? undefined
        : {
            args: metadataParts,
          },
  };
}

function emitConsoleLog(level: StructuredLogLevel, event: StructuredLogEvent) {
  const logInstance = consola.withTag(event.source);
  const metadata = event.metadata ? [event.metadata] : [];
  logInstance[level](event.message, ...metadata);
}

export function createConsoleLoggerAdapter(): LoggerAdapter {
  return {
    log(event) {
      emitConsoleLog(event.level, event);
    },
  };
}

export async function emitStructuredLog(logger: LoggerAdapter | undefined, event: StructuredLogEvent) {
  if (!logger) {
    return;
  }

  await logger.log(event);
}

export const logger = consola;
export const geminiLogger = createConsoleLoggerAdapter();
export const geminiLog = {
  trace(...args: unknown[]) {
    const normalized = normalizeLegacyLogArguments(args);
    emitConsoleLog("trace", {
      level: "trace",
      source: "gemini.legacy",
      message: normalized.message,
      metadata: normalized.metadata,
    });
  },
  debug(...args: unknown[]) {
    const normalized = normalizeLegacyLogArguments(args);
    emitConsoleLog("debug", {
      level: "debug",
      source: "gemini.legacy",
      message: normalized.message,
      metadata: normalized.metadata,
    });
  },
  info(...args: unknown[]) {
    const normalized = normalizeLegacyLogArguments(args);
    emitConsoleLog("info", {
      level: "info",
      source: "gemini.legacy",
      message: normalized.message,
      metadata: normalized.metadata,
    });
  },
  warn(...args: unknown[]) {
    const normalized = normalizeLegacyLogArguments(args);
    emitConsoleLog("warn", {
      level: "warn",
      source: "gemini.legacy",
      message: normalized.message,
      metadata: normalized.metadata,
    });
  },
  error(...args: unknown[]) {
    const normalized = normalizeLegacyLogArguments(args);
    emitConsoleLog("error", {
      level: "error",
      source: "gemini.legacy",
      message: normalized.message,
      metadata: normalized.metadata,
    });
  },
};
