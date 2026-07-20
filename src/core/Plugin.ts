import { assertGuardEquals, type tags } from 'typia';
import type { ChatEnginePluginConfig } from '../types/Plugin.js';

/** Chat Engine Plugin used to extend the functionality of the chat engine past raw chat capabilities. */
export class ChatEnginePlugin<T> {
    /** Object ID of the plugin to uniquely identify it compared to other plugins. */
    'id': string & tags.Format<'uuid'>;
    /** Async callback to be executed when the plugin is selected by the LLM. */
    'callback': ChatEnginePluginConfig<T>['callback'];
    /** Context to be provided to the LLM and SDK for param parsing and tool selection. */
    'configuration': ChatEnginePluginConfig<T>['configuration'];
    /** Group used for grouping plugins under a specific collection for LLM context. */
    'group': ChatEnginePluginConfig<T>['group'];
    /**
     * List of permissions required by the caller to allow the use of this plugin.
     *
     * If the list is empty, then the plugin can be used by any caller without restriction.
     */
    'requiredPermissionList': string[];

    /**
     * Instantiates, and configures a new instance of the Chat Engine Plugin and self registers it with the Chat Engine singleton instance.
     * @param props Configuration options used for instantiating the Chat Engine Plugin.
     */
    constructor(props: ChatEnginePluginConfig<T>) {
        // #region Input Validation
        assertGuardEquals<ChatEnginePluginConfig<unknown>>(props);
        // #endregion Input Validation

        // Set the Object ID of the plugin to uniquely identify it.
        this.id = props.id;

        // Set the async callback which will be executed when the plugin is selected by the LLM.
        this.callback = props.callback;

        // Set the configuration context to be provided to the LLM and SDK for param parsing and tool selection.
        this.configuration = props.configuration;

        // Ensure that the ID is set for the tool call name to ensure uniformity
        if ('name' in this.configuration) { this.configuration.name = props.id; }

        // Set the group used for grouping plugins under a specific collection for LLM context.
        this.group = props.group;

        // Configure the required permissions for the plugin, defaulting to an empty array if not provided indicating no permissions are required to use the plugin.
        this.requiredPermissionList = props.requiredPermissionList ?? [];
    }
}
