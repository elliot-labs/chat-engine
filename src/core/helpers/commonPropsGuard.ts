import { ChatEngine } from '../ChatEngine.js';
import type { CommonCallbackProps } from '../../types/Plugin.js';
import { equals } from 'typia';

/**
 * Type Guard that checks if the provided object is of type CommonCallbackProps.
 * Typia doesn't support classes, so we have to build a type guard of our own to validate the class component.
 * @param props Object to measure against the CommonCallbackProps type.
 * @returns Boolean flag indicating whether the provided object is of type CommonCallbackProps (`true`) or not (`false`).
 */
export function isCommonCallbackProps(props: CommonCallbackProps): props is CommonCallbackProps {
    // Ensure that the provided props object is of type 'object' and is not null. This is a basic check to ensure that the input is a valid object before performing further checks on its properties.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof props !== 'object' || props === null) { return false; }

    // Ensure that the chat engine property exists and is an instance of the ChatEngine class. This is a critical check to ensure that the object conforms to the expected structure of CommonCallbackProps.
    if (!('chatEngine' in props) || !(props.chatEngine instanceof ChatEngine)) { return false; }

    /** All the props except for the Typia incompatible ones. Passed as references to reduce memory footprint. */
    const toValidate: Omit<CommonCallbackProps, 'chatEngine'> = {
        'permissionList': props.permissionList,
        'tenantId': props.tenantId,
        'userId': props.userId,
        'vectorDb': props.vectorDb
    };

    // Ensure that all of the data matches as expected, otherwise throw an error
    return equals(toValidate);
}
