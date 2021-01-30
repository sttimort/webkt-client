import type { ISubscription } from 'rsocket-types';

export const INT32_MAX_VALUE = 0x7FFFFFFF;

export function requestInfiniteDemand(subscription: ISubscription) {
    subscription.request(INT32_MAX_VALUE);
}

export function isDefined(value: any) {
    return value !== null && value !== undefined;
}