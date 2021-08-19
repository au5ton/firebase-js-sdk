/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { FirebaseStorageError } from './error';
import { Headers, Connection } from './connection';

/**
 * Type for url params stored in RequestInfo.
 */
export interface UrlParams {
  [name: string]: string | number;
}

/**
 * A function that converts a server response to the API type expected by the
 * SDK.
 *
 * @param I - the type of the backend's network response (always `string` or
 * `ArrayBuffer`).
 * @param O - the output response type used by the rest of the SDK.
 */
export type RequestHandler<I, O> = (
  connection: Connection<I>,
  response: I
) => O;

/**
 * Contains a fully specified request.
 *
 * @param I - the type of the backend's network response (always `string` or
 * `ArrayBuffer`).
 * @param O - the output response type used by the rest of the SDK.
 */
export class RequestInfo<I, O> {
  urlParams: UrlParams = {};
  headers: Headers = {};
  body: Blob | string | Uint8Array | null = null;

  errorHandler:
    | ((p1: Connection<I>, p2: FirebaseStorageError) => FirebaseStorageError)
    | null = null;

  /**
   * Called with the current number of bytes uploaded and total size (-1 if not
   * computable) of the request body (i.e. used to report upload progress).
   */
  progressCallback: ((p1: number, p2: number) => void) | null = null;
  successCodes: number[] = [200];
  additionalRetryCodes: number[] = [];

  constructor(
    public url: string,
    public method: string,
    /**
     * Returns the value with which to resolve the request's promise. Only called
     * if the request is successful. Throw from this function to reject the
     * returned Request's promise with the thrown error.
     * Note: The XhrIo passed to this function may be reused after this callback
     * returns. Do not keep a reference to it in any way.
     */
    public handler: RequestHandler<I, O>,
    public timeout: number
  ) {}
}
