import type { CommonCallbackProps, PluginGroup } from '../../types/Plugin.js';
import { assertGuardEquals, is, tags } from 'typia';
import { ChatEnginePlugin } from '../Plugin.js';
import type { OpenIdConfiguration } from '../../types/plugins/microsoftCloud.js';

/** Category for Microsoft Cloud utility plugins. */
const microsoftCloudGroup: PluginGroup = {
    'description': 'Plugins that provide functionality for Microsoft Cloud services.',
    'id': 'a60ad5fd-4af6-4c51-9506-04fec46b9990',
    'name': 'Microsoft - Cloud',
    'pluginList': []
};

/** Unique properties for finding a tenant ID. */
interface FindTenantIdUniqueProps {
    /** Domain name to convert to a tenant ID. */
    'domainName': string & tags.Format<'hostname'>;
}

/**
 * Finds the Microsoft tenant ID for a given domain name.
 *
 * Error codes (and most likely way to fix the error after the pipe character):
 * - Unable to find tenant metadata! | Ensure that the provided domain name is correct. If the domain is correct, then it most likely doesn't have a tenant associated with it.
 * - Tenant configuration is in an unexpected format! | This should not happen, but if it does, file a bug report with the Microsoft team and on the Chat Engine's GitHub repo.
 * - The issuer is not a valid URL! | This should not happen, but if it does, file a bug report with the Microsoft team and on the Chat Engine's GitHub repo.
 * - The tenant identifier extracted from the issuer is not a GUID! | This should not happen, but if it does, file a bug report with the Microsoft team and on the Chat Engine's GitHub repo.
 * @param _common Common properties shared across all plugins.
 * @param unique Domain name to convert to a tenant ID.
 * @returns A promise that resolves to the tenant ID in UUID format or the LLM friendly error code if unable to retrieve the value.
 */
async function findTenantId(_common: CommonCallbackProps, unique: FindTenantIdUniqueProps): Promise<string & tags.Format<'uuid'>> {
    // #region Input Validation
    assertGuardEquals(unique);
    // #endregion Input Validation

    /** Raw OpenID configuration response for the specified tenant and version. */
    const rawConfigResponse = await fetch(`https://login.microsoftonline.com/${ unique.domainName }/v2.0/.well-known/openid-configuration`);

    // If the config is not available, return undefined as it is an invalid tenant
    if (rawConfigResponse.status !== 200) { return 'Unable to find tenant metadata!'; }

    /** Parsed OpenID configuration for the specified tenant and version. */
    const parsedOpenIdConfig = await rawConfigResponse.json() as OpenIdConfiguration;

    // Ensure that the parsed config is in the correct format before trusting its contents
    if (!is(parsedOpenIdConfig)) { return 'Tenant configuration is in an unexpected format!'; }

    // If the token configured issuer is not a valid URL, return undefined as it is not valid
    if (!URL.canParse(parsedOpenIdConfig.issuer)) { return 'The issuer is not a valid URL!'; }

    /** Issuer broken down into components so that regex is not needed when operating on the values within. */
    const parsedIssuerUrl = new URL(parsedOpenIdConfig.issuer);

    /** Extracted tenant ID from the token configured issuer URL. */
    // eslint-disable-next-line @typescript-eslint/prefer-destructuring
    const tenantId = parsedIssuerUrl.pathname.split('/')[1];

    // If the tenant ID extracted from the token configured issuer is not a valid UUID, return undefined as it is not valid
    if (!is<string & tags.Format<'uuid'>>(tenantId)) { return 'The tenant identifier extracted from the issuer is not a GUID!'; }

    // Return the tenant ID
    return tenantId;
}

/** Chat plugin that allows the LLM to find the tenant ID. */
export const pluginFindTenantId = new ChatEnginePlugin({
    'callback': findTenantId,
    'configuration': {
        'description': 'Use the Microsoft tenant\'s domain name to find the Microsoft tenant ID.',
        'name': '51d928fa-5678-4c8c-8dbc-bf8f5817d33e',
        'parameters': {
            'additionalProperties': false,
            'properties': {
                'domainName': {
                    'description': 'The domain name of the Microsoft tenant to translate.',
                    'type': 'string'
                }
            },
            'required': ['domainName'],
            'type': 'object'
        },
        'strict': true,
        'type': 'function'
    },
    'group': microsoftCloudGroup,
    'id': '51d928fa-5678-4c8c-8dbc-bf8f5817d33e'
});
