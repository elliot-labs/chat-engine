import { type TokenCredential, isTokenCredential } from '@azure/core-auth';
import { ChatEnginePlugin } from './Plugin.js';
import type { Embedding } from 'openai/resources';
import { OpenAI } from 'openai';
import { assertGuardEquals } from 'typia';
import { getBearerTokenProvider } from '@azure/identity';

/** Configuration options for initializing the conversation instance. */
interface ConversationConfig {
    /**
     * Used to authenticate with the host that provides the conversational LLM.
     *
     * Different authentication methods can be used depending on the type of host being used:
     * - If a `string` is provided, it will be used as a static API key for authentication.
     * - If a `TokenCredential` is provided, it will be used to obtain an access token for authentication.
     * This is useful for Azure Foundry or other services that have short lived access tokens that need to be refreshed periodically and automatically.
     */
    'authentication': string | TokenCredential;
    /**
     * Scope used for obtaining the access token when using a TokenCredential.
     * Defaults to Microsoft AI Foundry. If your using a custom host, you may need to provide a different scope.
     * @default 'https://ai.azure.com/.default'
     */
    'authScope'?: string;
    /** System prompt for the chat engine. This will be injected into the conversation context. */
    'systemPrompt'?: string;
    /**
     * Hostname of the server where the conversational LLM is hosted.
     * If the host is not provided, the OpenAI host will be used.
     * @example Azure Foundry
     * `https://YOUR-RESOURCE-NAME.openai.azure.com/openai/v1/`
     * @example LM Studio
     * `http://localhost:1234/v1/`
     */
    'host'?: string;
    /**
     * Name of the model to be used by the chat engine.
     * If using a custom host like LM Studio, this is the Model ID.
     * @example OpenAI
     * `gpt-5.5`
     * @example LM Studio
     * `google/gemma-4-26b-a4b`
     */
    'model': string;
}

/** Configuration options for initializing the embeddings instance. */
interface EmbeddingsConfig {
    /**
     * Used to authenticate with the host that provides the embeddings model.
     *
     * Different authentication methods can be used depending on the type of host being used:
     * - If a `string` is provided, it will be used as a static API key for authentication.
     * - If a `TokenCredential` is provided, it will be used to obtain an access token for authentication.
     * This is useful for Azure Foundry or other services that have short lived access tokens that need to be refreshed periodically and automatically.
     */
    'authentication': string | TokenCredential;
    /**
     * Scope used for obtaining the access token when using a TokenCredential.
     * Defaults to Microsoft AI Foundry.
     * If your using a custom host, you may need to provide a different scope.
     * @default 'https://ai.azure.com/.default'
     */
    'authScope'?: string;
    /**
     * Hostname of the server where the embeddings model is hosted.
     * If the host is not provided, the OpenAI host will be used.
     * @example Azure Foundry
     * `https://YOUR-RESOURCE-NAME.openai.azure.com/openai/v1/`
     * @example LM Studio
     * `http://localhost:1234/v1/`
     */
    'host'?: string;
    /**
     * Name of the model to be used by the chat engine.
     * If using a custom host like LM Studio, this is the Model ID.
     * @example OpenAI
     * `text‑embedding‑3‑large`
     * @example LM Studio
     * `google/gemma-4-26b-a4b`
     */
    'model': string;
}

/** Chat Engine singleton class. */
export class ChatEngine {
    /** List of plugins that are registered with the chat engine. */
    #plugins: ChatEnginePlugin[];
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
        this.#plugins = [];
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
        // #endregion Input Validation

        if (this.#plugins.some((currentPlugin) => currentPlugin.id === plugin.id)) { throw new TypeError('A plugin with the same ID is already registered!', { 'cause': 'Input Validation!' }); }

        // Add the plugin to the list of registered plugins
        this.#plugins.push(plugin);
    }

    /**
     * Processes a chat message by sending it to the conversation client.
     * @param userMessage The message from the user to be processed.
     */
    public async processChatMessage(userMessage: string): Promise<void> {
        // #region Input Validation
        assertGuardEquals(userMessage);
        // #endregion Input Validation

        /** Results of processing the chat message. */
        await this.#conversationClient.responses.create({
            'input': userMessage,
            'model': this.#conversationConfig.model
        });
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
