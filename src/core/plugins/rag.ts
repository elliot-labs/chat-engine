import type { CommonCallbackProps, PluginGroup } from '../../types/Plugin.js';
import { ChatEnginePlugin } from '../Plugin.js';
import { assertGuardEquals } from 'typia';

/** Category for retrieval augmented generation (RAG) plugins. */
const ragGroup: PluginGroup = {
    'description': 'Utilities meant for retrieval augmented generation.',
    'id': '1c6b7bd6-5b3d-42f8-bb80-cb3618ae06db',
    'name': 'RAG',
    'pluginList': []
};

/** Unique properties for the cosine similarity search plugin. */
interface CosineSearchUniqueProps {
    /** The query string for the cosine similarity search. */
    'query': string;
    /** Optional number of search results to return at the max, may return fewer if not enough results are found. */
    'resultMaxCount': number;
}

/**
 * Uses the Cosine Similarity algorithm to perform a RAG search based on vector representations.
 *
 * This search type is best for human language queries and is the most common type of RAG search.
 * If you have specific identifiers for the content you want to retrieve, consider using a RAG Exact Match search plugin or use a SQL DB instead.
 * @param common Common properties shared across all plugins.
 * @param unique Unique properties specific to this plugin.
 * @returns Lorem ipsum.
 */
async function invokeCosineSimilaritySearch(common: CommonCallbackProps, unique: CosineSearchUniqueProps): Promise<string> {
    // #region Input Validation
    assertGuardEquals(common);

    assertGuardEquals(unique);

    // Ensure that a source vector database has been loaded
    if (common.vectorDb.length === 0) { throw new RangeError('Source vector database is empty.', { 'cause': 'Input Validation!' }); }

    /** Vector that is used as the query vector to be compared against the source vector. */
    const queryVector = await common.chatEngine.newContentVectorList(unique.query);

    // Ensure that the query vector is not empty, as an empty vector would make cosine similarity calculations invalid.
    if (queryVector.embedding.length === 0) { throw new RangeError('Query vector is empty.', { 'cause': 'Input Validation!' }); }

    // Ensure that the query vector length matches the source vector length, as mismatched lengths would make cosine similarity calculations invalid due to a dimension mismatch.
    if (queryVector.embedding.length !== common.vectorDb[0]!.embedding.length) { throw new RangeError('Query and source vector DB dimensions do not match.', { 'cause': 'Input Validation!' }); }

    // #endregion Input Validation

    /** Accumulated sum of squares for the query vector. */
    let queryNormSq = 0;

    // Iterate over each element in the query vector to calculate the sum of squares for the norm calculation.
    for (const extractedQueryVector of queryVector.embedding) {
        // Square the extracted query vector and add it to the cumulative sum for the norm calculation.
        queryNormSq += extractedQueryVector * extractedQueryVector;
    }

    /** Magnitude (norm) of the query vector. */
    const queryNorm = Math.sqrt(queryNormSq);

    /** DB in the order of matches based on cosine similarity. */
    const searchedDb = common.vectorDb.toSorted((firstRow, secondRow) => {
        // Calculate Dot Product and Magnitude for Vector A

        /** Dot product of the query vector and the first row vector. */
        let dotProductFirstRow = 0;

        /** Squared magnitude (norm) of the first row vector. */
        let normASq = 0;

        // Iterate over each element in the query vector to calculate the dot product and squared magnitude for the first row vector.
        for (let index = 0; index < queryVector.embedding.length; index++) {
            // Calculate the dot product of the query vector and the first row vector by multiplying corresponding elements and accumulating the sum.
            dotProductFirstRow += queryVector.embedding[index]! * firstRow.embedding[index]!;

            // Calculate the squared magnitude (norm) of the first row vector by squaring each element and accumulating the sum.
            normASq += firstRow.embedding[index]! * firstRow.embedding[index]!;
        }

        /** Cosine similarity between the query vector and the first row vector. */
        const similarityA = dotProductFirstRow / (queryNorm * Math.sqrt(normASq));

        // Calculate Dot Product and Magnitude for Vector B

        /** Dot product of the query vector and the second row vector. */
        let dotB = 0;

        /** Squared magnitude (norm) of the second row vector. */
        let normBSq = 0;

        // Iterate over each element in the query vector to calculate the dot product and squared magnitude for the second row vector.
        for (let index = 0; index < queryVector.embedding.length; index++) {
            // Calculate the dot product of the query vector and the second row vector by multiplying corresponding elements and accumulating the sum.
            dotB += queryVector.embedding[index]! * secondRow.embedding[index]!;

            // Calculate the squared magnitude (norm) of the second row vector by squaring each element and accumulating the sum.
            normBSq += secondRow.embedding[index]! * secondRow.embedding[index]!;
        }

        /** Cosine similarity between the query vector and the second row vector. */
        const similarityB = dotB / (queryNorm * Math.sqrt(normBSq));

        // Return descending order: Highest similarity (closest to 1) comes first
        return similarityB - similarityA;
    });

    /** Set of search results with the closest cosine similarity to the query string. */
    const topResults = searchedDb.slice(0, unique.resultMaxCount).map((dbRow) => dbRow.input);

    // Join the search results into a single string to return to the LLM for processing.
    return topResults.join('\n---next search result---\n');
}

/** Chat plugin that allows the LLM to perform RAG cosine similarity searches. */
export const searchRagCosineSimilarity = new ChatEnginePlugin<CosineSearchUniqueProps>({
    'callback': invokeCosineSimilaritySearch,
    'configuration': {
        'description': 'Perform RAG search using the cosine similarity algorithm for natural language content.',
        'name': 'b2101f5f-fee3-4051-8629-1efb420ff8d4',
        'parameters': {
            'additionalProperties': false,
            'properties': {
                'query': { 'type': 'string' },
                'resultMaxCount': { 'type': 'number' }
            },
            'required': ['query', 'resultMaxCount'],
            'type': 'object'
        },
        'strict': true,
        'type': 'function'
    },
    'group': ragGroup,
    'id': '8662e698-c3a9-449e-80fc-ba31a2960416'
});
