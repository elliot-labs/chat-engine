/** Minimal set of OpenID Connect configuration properties used for token validation. */
export interface OpenIdConfiguration {
    /** Identifier of the issuer of the tokens for the specific tenant. */
    'issuer': string;
}
