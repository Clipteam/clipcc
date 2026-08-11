/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as jsdom from 'jsdom';
import type {
  EnvironmentContext,
  JestEnvironmentConfig
} from '@jest/environment';
import BaseEnv from '@jest/environment-jsdom-abstract';

/**
 * Custom environment for jsdom (27.1.0).
 */
export default class Environment extends BaseEnv {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context, jsdom);

    // Copied from jest-fixed-jsdom.

    this.customExportConditions = [''];

    this.global.TextDecoder = TextDecoder;
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoderStream = TextDecoderStream;
    this.global.TextEncoderStream = TextEncoderStream;
    this.global.ReadableStream = ReadableStream;

    this.global.Blob = Blob;
    this.global.Headers = Headers;
    this.global.FormData = FormData;
    this.global.Request = Request;
    this.global.Response = Response;
    this.global.fetch = fetch;
    this.global.AbortController = AbortController;
    this.global.AbortSignal = AbortSignal;
    this.global.structuredClone = structuredClone;
    this.global.URL = URL;
    this.global.URLSearchParams = URLSearchParams;

    this.global.BroadcastChannel = BroadcastChannel;
    this.global.TransformStream = TransformStream;
    this.global.MessageChannel = MessageChannel;
    this.global.MessagePort = MessagePort;
  }
}
