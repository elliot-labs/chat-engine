import type { ConversationConfig, EmbeddingResult, EmbeddingsConfig } from '../types/ChatEngine.js';
import { assertGuardEquals, type tags } from 'typia';
import { ChatEnginePlugin } from './Plugin.js';
import { OpenAI } from 'openai';
import type { ResponseInputItem } from 'openai/resources/responses/responses.js';
import { getBearerTokenProvider } from '@azure/identity';
import { isTokenCredential } from '@azure/core-auth';
import { toResponseInputItems } from 'openai/lib/responses/ResponseInputItems';

/** LLM interaction engine. Supports chat, embeddings, and plugin management. */
export class ChatEngine {
    /** List of plugins that are registered with the chat engine. */
    #plugins: Record<string & tags.Format<'uuid'>, ChatEnginePlugin>;
    /** Instance of the configured OpenAI client used for processing chat messages and LLM operations. */
    #conversationClient: OpenAI;
    /** Instance of the configured OpenAI client used for generating embeddings. */
    #embeddingsClient: OpenAI | undefined;
    /** Configuration options for the conversation instance. */
    #conversationConfig: Omit<ConversationConfig, 'authentication'>;
    /** Configuration options for the embeddings instance. */
    #embeddingsConfig: Omit<EmbeddingsConfig, 'authentication'> | undefined;

    // #region Initialization

    /**
     * Initializes a new instance of the ChatEngine class with the provided configuration options for the conversation and embeddings instances.
     * @param chatConfig Configuration options for initializing the conversation instance.
     * @param embeddingConfig Optional configuration options for initializing the embeddings instance. If not provided, the embeddings client will not be initialized.
     */
    constructor(chatConfig: ConversationConfig, embeddingConfig?: EmbeddingsConfig) {
        // Ensure that the provided token is an API key or a TokenCredential instance. If not, throw an error.
        if (typeof chatConfig.authentication !== 'string' && !isTokenCredential(chatConfig.authentication)) { throw new TypeError('The provided authentication is not a valid API key or TokenCredential instance!', { 'cause': 'Input Validation!' }); }

        /** Capture the chat auth reference before it is removed from the config. */
        const chatAuth = typeof chatConfig.authentication === 'string'
            ? chatConfig.authentication
            : getBearerTokenProvider(chatConfig.authentication, chatConfig.authScope ?? 'https://ai.azure.com/.default');

        // Remove the authentication property from the configuration object to prevent it from being stored in the instance and for validation compatibility.
        delete (chatConfig as Partial<ConversationConfig>).authentication;

        // Ensure there isn't anything tricky in the provided config.
        assertGuardEquals<Omit<ConversationConfig, 'authentication'>>(chatConfig);

        // Store the provided configuration options for the conversation and embeddings instances.
        this.#conversationConfig = chatConfig;

        // Create an instance of the OpenAI client to be used for processing chat messages.
        this.#conversationClient = new OpenAI({
            'apiKey': chatAuth,
            'baseURL': this.#conversationConfig.host
        });

        // Only initialize the embeddings client if the configuration options are provided.
        if (embeddingConfig) {
            // Ensure that the provided token is an API key or a TokenCredential instance. If not, throw an error.
            if (typeof embeddingConfig.authentication !== 'string' && !isTokenCredential(embeddingConfig.authentication)) { throw new TypeError('The provided authentication is not a valid API key or TokenCredential instance!', { 'cause': 'Input Validation!' }); }

            /** Capture the embeddings auth reference before it is removed from the config. */
            const embeddingsAuth = typeof embeddingConfig.authentication === 'string'
                ? embeddingConfig.authentication
                : getBearerTokenProvider(embeddingConfig.authentication, embeddingConfig.authScope ?? 'https://ai.azure.com/.default');

            // Remove the authentication property from the configuration object to prevent it from being stored in the instance and for validation compatibility.
            delete (embeddingConfig as Partial<EmbeddingsConfig>).authentication;

            // Ensure there isn't anything tricky in the provided config.
            assertGuardEquals<Omit<EmbeddingsConfig, 'authentication'>>(embeddingConfig);

            // Store the provided configuration options for the embeddings instance.
            this.#embeddingsConfig = embeddingConfig;

            // Create an instance of the OpenAI client to be used for generating embeddings.
            this.#embeddingsClient = new OpenAI({
                'apiKey': embeddingsAuth,
                'baseURL': embeddingConfig.host
            });
        }

        // Initialize the plugins list
        this.#plugins = {};
    }

    // #endregion Initialization

    /**
     * Registers the provided plugin within the Chat Engine.
     * @param plugin Plugin that is to be registered with the Chat Engine.
     * @throws {TypeError} If the provided plugin is not an instance of ChatEnginePlugin or if a plugin with the same ID is already registered.
     */
    public registerPlugin(plugin: ChatEnginePlugin): void {
        // #region Input Validation
        if (!(plugin instanceof ChatEnginePlugin)) { throw new TypeError('The provided plugin is not a Chat Engine Plugin!', { 'cause': 'Input Validation!' }); }

        if (plugin.id in this.#plugins) { throw new TypeError('A plugin with the same ID is already registered!', { 'cause': 'Input Validation!' }); }
        // #endregion Input Validation

        // Add the plugin to the list of registered plugins
        this.#plugins[plugin.id] = plugin;
    }

    /**
     * Processes a chat message by sending it to the conversation client.
     * @param userMessage The message from the user to be processed.
     * @param permissionList List of permissions associated with the user message. Used for tool calls/plugin access control.
     * @param userId Unique Identifier for the user sending the message. Used for safety and moderation purposes on cloud hosted models. This should not include PII, please try to use a GUID or hashed value of some immutable identifier.
     * @param messageHistory Optional history of previous messages in the conversation. If not provided, only the current user message will be processed.
     * @throws {TypeError} If the user message, permission list, or message history is not valid.
     * @returns A promise that resolves to an array of ResponseInputItem objects representing the conversation history and any output from the model.
     */
    public async processChatMessage(userMessage: string, permissionList: string[], userId: string, messageHistory?: ResponseInputItem[]): Promise<ResponseInputItem[]> {
        // #region Input Validation
        assertGuardEquals(userMessage);

        assertGuardEquals(permissionList);

        assertGuardEquals(userId);

        assertGuardEquals(messageHistory);
        // #endregion Input Validation

        /** Conversation history for the current chat message. */
        let conversationHistory: ResponseInputItem[] = [
            {
                'content': userMessage,
                'role': 'user'
            }
        ];

        // If message history is provided and is not empty, prepend it to the conversation history.
        if (messageHistory && messageHistory.length !== 0) { conversationHistory.unshift(...messageHistory); }

        // Check if a system prompt is configured and inject it into the conversation history if so.
        if (this.#conversationConfig.systemPrompt) {
            // Inject the system prompt at the beginning
            conversationHistory.unshift({
                'content': this.#conversationConfig.systemPrompt,
                'role': 'developer'
            });
        }

        /** Results of processing the chat message. */
        const processingResult = await this.#conversationClient.responses.create({
            'input': conversationHistory,
            'model': this.#conversationConfig.model,
            'safety_identifier': userId
        });

        // Add the output text from the processing result to the conversation history
        conversationHistory.push(...toResponseInputItems(processingResult.output));

        // Remove any system prompts from the history to ensure that they do not leak to the end user
        conversationHistory = conversationHistory.filter((message) => {
            // Check if the role is present, if so, filter out any messages with the role of 'developer' (system prompt).
            if ('role' in message && message.role === 'developer') { return false; }

            // The message is allowed to remain in the conversation history if it is not a system prompt.
            return true;
        });

        // Return the results of processing the chat message, including the conversation history and any output from the model.
        return conversationHistory;
    }

    /**
     * Generates embeddings for the provided content using the initialized embeddings client.
     *
     * This method will throw an error if the embeddings client is not initialized, which occurs when the embeddings configuration is not provided during ChatEngine initialization.
     * @throws {TypeError} If the embeddings client is not initialized.
     * @param content The content for which embeddings are to be generated.
     * @returns A promise that resolves to an array of embeddings.
     */
    public async generateEmbedding(content: string): Promise<EmbeddingResult> {
        // #region Input Validation
        assertGuardEquals(content);

        // Ensure that the embeddings client is initialized before attempting to generate embeddings.
        if (!this.#embeddingsClient || !this.#embeddingsConfig) { throw new TypeError('Embeddings client is not initialized. Please provide embeddings configuration during ChatEngine initialization.', { 'cause': 'Embeddings Client Not Initialized!' }); }
        // #endregion Input Validation

        /** List of vectors for the provided content. */
        const vectorList = await this.#embeddingsClient.embeddings.create({
            'encoding_format': 'float',
            'input': content,
            'model': this.#embeddingsConfig.model
        });

        // Ensure the embeddings were generated successfully. If not, throw an error.
        if (vectorList.data.length === 0) { throw new TypeError('No embeddings were generated for the provided content!', { 'cause': 'Operation Failed!' }); }

        /** Embedding result for the provided content. */
        const embedding: EmbeddingResult = {
            'embedding': vectorList.data[0]!.embedding,
            'input': content
        };

        // Return the embedding generated by the model along with the associated content.
        return embedding;
    }
}
