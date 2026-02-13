type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const getTimestamp = () => new Date().toISOString();

const formatMessage = (level: LogLevel, message: string, data?: any) => {
    const timestamp = getTimestamp();
    const dataString = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${dataString}`;
};

export const logger = {
    info: (message: string, data?: any) => {
        // eslint-disable-next-line no-console
        console.log(formatMessage('info', message, data));
    },
    warn: (message: string, data?: any) => {
        // eslint-disable-next-line no-console
        console.warn(formatMessage('warn', message, data));
    },
    error: (message: string, error?: any) => {
        // eslint-disable-next-line no-console
        console.error(formatMessage('error', message, error));
    },
    debug: (message: string, data?: any) => {
        // Only log debug messages in development
        if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.debug(formatMessage('debug', message, data));
        }
    },
};
