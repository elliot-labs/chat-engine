import type { tags } from 'typia';

/** Configuration options used for instantiating the Chat Engine Plugin. */
export interface ChatEnginePluginConfig {
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
