import { assertGuardEquals, type tags } from 'typia';

/** Configuration options used for instantiating the Chat Engine Plugin. */
interface ChatEnginePluginConfig {
    /**
     * Object ID of the plugin to uniquely identify it compared to other plugins.
     *
     * This must be unique across all plugins, otherwise the chat engine will throw an error when attempting to register a plugin.
     */
    'id': string & tags.Format<'uuid'>;
    /**
     * List of permissions required by the caller to allow the use of this plugin.
     *
     * If the list is empty or not provided, then the plugin can be used by any caller without restriction.
     */
    'requiredPermissions'?: string[];
}

/** Chat Engine Plugin used to extend the functionality of the chat engine past raw chat capabilities. */
export class ChatEnginePlugin {
    /** Object ID of the plugin to uniquely identify it compared to other plugins. */
    'id': string & tags.Format<'uuid'>;
    /**
     * List of permissions required by the caller to allow the use of this plugin.
     *
     * If the list is empty, then the plugin can be used by any caller without restriction.
     */
    'requiredPermissions': string[];

    /**
     * Instantiates, and configures a new instance of the Chat Engine Plugin and self registers it with the Chat Engine singleton instance.
     * @param config Configuration options used for instantiating the Chat Engine Plugin.
     */
    constructor(config: ChatEnginePluginConfig) {
        // #region Input Validation
        assertGuardEquals(config);
        // #endregion Input Validation

        // Set the Object ID of the plugin to uniquely identify it.
        this.id = config.id;

        // Configure the required permissions for the plugin, defaulting to an empty array if not provided indicating no permissions are required to use the plugin.
        this.requiredPermissions = config.requiredPermissions ?? [];
    }
}
