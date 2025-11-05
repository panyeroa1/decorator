/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type LocationState = { type: 'coords', value: { latitude: number; longitude: number; } } | { type: 'query', value: string } | null;
