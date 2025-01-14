/**
 * @license
 * Copyright 2020 Google LLC
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

import tmp from 'tmp';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';
import typescriptPlugin from 'rollup-plugin-typescript2';
import typescript from 'typescript';
import replace from 'rollup-plugin-replace';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

const util = require('./rollup.shared');

const nodePlugins = function () {
  return [
    typescriptPlugin({
      typescript,
      tsconfigOverride: {
        compilerOptions: {
          target: 'es2017'
        }
      },
      cacheDir: tmp.dirSync(),
      abortOnError: false,
      transformers: [util.removeAssertTransformer]
    }),
    json({ preferConst: true }),
    // Needed as we also use the *.proto files
    copy({
      targets: [
        {
          src: 'src/protos',
          dest: 'dist/src'
        }
      ]
    }),
    replace({
      'process.env.FIRESTORE_PROTO_ROOT': JSON.stringify('src/protos')
    })
  ];
};

const browserPlugins = function () {
  return [
    typescriptPlugin({
      typescript,
      tsconfigOverride: {
        compilerOptions: {
          target: 'es2017'
        }
      },
      cacheDir: tmp.dirSync(),
      clean: true,
      abortOnError: false,
      transformers: [util.removeAssertAndPrefixInternalTransformer]
    }),
    json({ preferConst: true }),
    terser(util.manglePrivatePropertiesOptions)
  ];
};

const allBuilds = [
  // Node ESM build
  {
    input: './src/index.node.ts',
    output: {
      file: pkg['main-esm'],
      format: 'es',
      sourcemap: true
    },
    plugins: [alias(util.generateAliasConfig('node')), ...nodePlugins()],
    external: util.resolveNodeExterns,
    treeshake: {
      moduleSideEffects: false
    },
    onwarn: util.onwarn
  },
  // Node CJS build
  {
    input: pkg['main-esm'],
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true
    },
    plugins: util.es2017ToEs5Plugins(/* mangled= */ false),
    external: util.resolveNodeExterns,
    treeshake: {
      moduleSideEffects: false
    }
  },
  // Browser build
  {
    input: './src/index.ts',
    output: {
      file: pkg.browser,
      format: 'es',
      sourcemap: true
    },
    plugins: [alias(util.generateAliasConfig('browser')), ...browserPlugins()],
    external: util.resolveBrowserExterns,
    treeshake: {
      moduleSideEffects: false
    }
  },
  // Convert es2017 build to ES5
  {
    input: pkg['browser'],
    output: [
      {
        file: pkg['esm5'],
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: util.es2017ToEs5Plugins(/* mangled= */ true),
    external: util.resolveBrowserExterns,
    treeshake: {
      moduleSideEffects: false
    }
  },
  // RN build
  {
    input: './src/index.rn.ts',
    output: {
      file: pkg['react-native'],
      format: 'es',
      sourcemap: true
    },
    plugins: [alias(util.generateAliasConfig('rn')), ...browserPlugins()],
    external: util.resolveBrowserExterns,
    treeshake: {
      moduleSideEffects: false
    }
  }
];

export default allBuilds;
