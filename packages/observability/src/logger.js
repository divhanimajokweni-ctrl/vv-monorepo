function write(level, message, fields) {
    console.log(JSON.stringify({
        level,
        message,
        ...fields,
        ts: new Date().toISOString()
    }));
}
export const logger = {
    info(message, fields) {
        write("info", message, fields);
    },
    warn(message, fields) {
        write("warn", message, fields);
    },
    error(message, fields) {
        write("error", message, fields);
    }
};
