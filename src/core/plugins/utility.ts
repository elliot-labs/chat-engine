import type { CommonCallbackProps, PluginGroup } from '../../types/Plugin.js';
import { ChatEnginePlugin } from '../Plugin.js';

/** Category for general utility plugins. */
const utilityGroup: PluginGroup = {
    'description': 'General utility plugins that provide basic functionality across a variety of contexts.',
    'id': 'a60ad5fd-4af6-4c51-9506-04fec46b9990',
    'name': 'General Utilities',
    'pluginList': []
};

/**
 * Captures the current date and time in ISO 8601 format.
 * @param _common Common properties shared across all plugins.
 * @param _unique Unique properties specific to this plugin.
 * @returns A promise that resolves to an ISO 8601 formatted timestamp representing the current date and time.
 */
async function getTimestamp(_common: CommonCallbackProps, _unique: unknown): Promise<string> {
    /** ISO 8601 formatted timestamp representing the current date and time. */
    const stamp = new Date().toISOString();

    // Wrap the timestamp in a promise to ensure it conforms to the plugin structure.
    return Promise.resolve(stamp);
}

/** Chat plugin that allows the LLM see the current date and time. */
export const getDateTime = new ChatEnginePlugin({
    'callback': getTimestamp,
    'configuration': {
        'description': 'Get the current date and time.',
        'name': '8662e698-c3a9-449e-80fc-ba31a2960416',
        'parameters': {
            'additionalProperties': false,
            'properties': {},
            'required': [],
            'type': 'object'
        },
        'strict': true,
        'type': 'function'
    },
    'group': utilityGroup,
    'id': '8662e698-c3a9-449e-80fc-ba31a2960416'
});
