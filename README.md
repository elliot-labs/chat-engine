# Elliot Labs' Chat Engine

[![NPM Version](https://img.shields.io/npm/v/%40elliot-labs%2Fchat-engine)](https://www.npmjs.com/package/@elliot-labs/chat-engine)
[![GitHub License](https://img.shields.io/github/license/elliot-labs/chat-engine)](https://github.com/elliot-labs/chat-engine/blob/main/LICENSE)
[![Socket Badge](https://badge.socket.dev/npm/package/@elliot-labs/chat-engine/latest)](https://badge.socket.dev/npm/package/@elliot-labs/chat-engine/latest)

An extendable LLM Harness designed for OpenAI-compatible LLM hosts. This engine allows you to extend the core capabilities of a chat model through a robust, type-safe plugin architecture, supporting advanced features like Retrieval Augmented Generation (RAG) and Role-Based Access Control (RBAC).

## 🚀 Features

- **Plugin Architecture**: Extend the engine's functionality using `ChatEnginePlugin`. Plugins can define custom tools, parameters, and required permissions.
- **OpenAI Compatible**: Works seamlessly with any LLM host that adheres to the OpenAI API standard.
- **RAG Ready**: Built-in support for vector-based retrieval via Cosine Similarity search plugins.
- **Role-Based Access Control (RBAC)**: Securely manage plugin availability by defining `requiredPermissionList` for each plugin, ensuring users only access tools they are authorized to use.
- **Security First**:
  - **PII Protection**: Automatically hashes User IDs using SHA256 before sending them to the LLM host to maintain privacy while allowing for safety attribution.
  - **Supply Chain Security**: Fully integrated with **Socket Security** at all levels (CI/CD and GitHub).
  - **Input Validation**: All methods and functions in the package don't trust ANY of their inputs and use [Typia](https://typia.io/) to guard them to reduce risk of unexpected data and data shapes messing up your day.
- **Dual Client Support**: Simultaneous support for Chat completion and Embeddings generation within a single engine instance.

## 📦 Installation

Install the package via npm:

```bash
npm install @elliot-labs/chat-engine
```

## 🛠 Quick Start

```typescript
import { ChatEngine } from '@elliot-labs/chat-engine';

const chatConfig = {
    host: 'https://your-openai-compatible-host.com/v1',
    model: 'gpt-4',
    authentication: 'your-api-key'
};

const engine = new ChatEngine(chatConfig);

// Register a plugin (e.g., the built-in DateTime utility)
// engine.registerPlugin(getDateTime);

async function chat(message: string) {
    const metadata = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        permissionList: ['date-access'] 
    };

    const response = await engine.invokeLanguageModel(message, metadata);
    console.log(response);
}

chat("What time is it?");
```

## 🧩 Developing Plugins

Creating a plugin is straightforward using the `ChatEnginePlugin` class. You define a callback function that executes when the LLM requests the tool, along with a JSON schema configuration for the parameters.

```typescript
import { ChatEnginePlugin } from '@elliot-labs/chat-engine';

export const myPlugin = new ChatEnginePlugin({
    id: 'your-uuid-here',
    callback: async (common, args) => {
        // Logic goes here
        return "Result from plugin";
    },
    configuration: {
        name: 'your-uuid-here',
        description: 'A description for the LLMTool',
        parameters: { /* JSON Schema */ },
        type: 'function'
    },
    group: myGroup,
});
```

## 💻 Development Setup

To contribute to this project or work on it locally, follow these steps:

1. **Prerequisites**: Ensure you have **Node.js (>=24.18.0)** and **npm** installed.
2. **Open in VS Code**: This project includes a pre-configured workspace file. Open the project using:

    ```bash
    code "Chat Engine.code-workspace"
    ```

    *Note: The recommended extensions and settings are already included in this workspace file.*
3. **Install Dependencies**:

    ```bash
    npm install
    ```

4. **Security Recommendation**: We highly recommend using **Socket Firewall** when developing to reduce the risk of supply chain malware during the dependency installation process.

## 🛡 Security & Compliance

This project is built with a security-first mindset:

- **Socket Security Integration**: Our CI/CD pipelines and GitHub environment are protected by Socket to reduce the risk and impact of dependency attacks.
- **Identity Management**: Supports both API Keys and `TokenCredential` (Azure Identity) for secure authentication.
