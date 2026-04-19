type LogFields = Record<string, unknown>;
export declare const logger: {
    info(message: string, fields?: LogFields): void;
    warn(message: string, fields?: LogFields): void;
    error(message: string, fields?: LogFields): void;
};
export {};
