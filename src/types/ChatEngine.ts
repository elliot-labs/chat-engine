import type { TokenCredential } from '@azure/core-auth';

/** Configuration options for initializing the conversation instance. */
export interface ConversationConfig {
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
export interface EmbeddingsConfig {
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

/** Represents the result of generating embeddings for a given input. */
export interface EmbeddingResult {
    /** The generated embedding vector. */
    'embedding': number[];
    /** The input string for which the embeddings were generated. */
    'input': string;
}
