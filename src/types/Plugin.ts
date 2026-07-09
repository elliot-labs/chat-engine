import type { ChatEnginePlugin } from '../core/Plugin.js';
import type { Tool } from 'openai/resources/responses/responses';
import type { tags } from 'typia';

/** Grouping mechanism for plugins under a specific collection for LLM context. */
export interface PluginGroup {
    /** Unique identifier for the plugin group to be used by the auto grouping system for de-duplication/assignment. */
    'id': string & tags.Format<'uuid'>;
    /** Short human friendly display name of the group. */
    'name': string;
    /** Context for the LLM to be able to tell what this group of plugins is for compared to other sets of plugins. A type of context prompt. */
    'description': string;
    /** List of plugins that belong to this group. */
    'pluginList': ChatEnginePlugin<unknown>[];
}

/** Parameters that are common to all plugins. */
export interface CommonCallbackProps {
    /** Unique identifier for the authenticated user using the plugin. */
    'userId': string;
}

/** Configuration options used for instantiating the Chat Engine Plugin. */
export interface ChatEnginePluginConfig<T> {
    /**
     * Object ID of the plugin to uniquely identify it compared to other plugins.
     *
     * This must be unique across all plugins, otherwise the chat engine will throw an error when attempting to register a plugin.
     */
    'id': string & tags.Format<'uuid'>;
    /** Async callback to be executed when the plugin is selected. */
    'callback': (commonProps: CommonCallbackProps, uniqueProps: T) => Promise<string>;
    /** Configurations to send to the LLM so that they can understand and execute the plugin's functionality properly. */
    'configuration': Tool;
    /**
     * Used as a common collection of plugins under a specific category.
     *
     * This ensures that two plugins with the same overall function configuration but different overall categories are not confused for each other by the LLM.
     * For example, a plugin that provides a calculator function for math and a plugin that provides a calculator function for finance should be categorized differently to avoid confusion.
     */
    'group'?: PluginGroup;
    /**
     * List of permissions required by the caller to allow the use of this plugin.
     *
     * If the list is empty or not provided, then the plugin can be used by any caller without restriction.
     */
    'requiredPermissionList'?: string[];
}
