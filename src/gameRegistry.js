export const supportedEngines = ['iframe', 'standalone', 'bridge'];

export function validateGameConfig(config) {
    if (!config.name || !config.engine) {
        throw new Error("Invalid game configuration");
    }
    return true;
}
