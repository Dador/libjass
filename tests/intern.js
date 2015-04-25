/**
 * libjass
 *
 * https://github.com/Arnavion/libjass
 *
 * Copyright 2013 Arnav Singh
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(["intern", "intern/dojo/Promise"], function (intern, DojoPromise) {
	var result = {
		suites: [
			"tests/unit/minified",
			"tests/unit/miscellaneous",
			"tests/unit/polyfills",
			"tests/unit/primitives",
			"tests/unit/tags",
			"tests/unit/webworker"
		],
		functionalSuites: [
			"tests/functional/kfx/kfx"
		],
		excludeInstrumentation: /^(?:tests|node_modules)\//,
		tunnel: "NullTunnel",
		environments: [{
			browserName: "chrome",
		}],
		matrix: {
			dimensions: {
				"force-polyfills": (function () {
					var originalSet = null;
					var originalMap = null;
					var originalPromise = null;

					return {
						values: [true, false],
						before: function (value) {
							return new DojoPromise(function (resolve, reject) {
								require(["intern/chai!assert", "lib/libjass"], function (assert, libjass) {
									try {
										assert.isFunction(libjass.Set, "libjass.Set is not a function.");

										originalSet = libjass.Set;

										if (value) {
											if (typeof Set !== "undefined") {
												assert.equal(originalSet, Set, "libjass.Set did not default to the runtime's implementation.");
											}

											libjass.Set = null;
											assert.isNotNull(libjass.Set, "libjass.Set actually got set to null instead of SimpleSet.");

											if (typeof Set !== "undefined") {
												assert.notEqual(libjass.Set, originalSet, "libjass.Set is still the runtime's implementation of Set.");
											}
										}

										assert.isFunction(libjass.Map, "libjass.Map is not a function.");

										originalMap = libjass.Map;

										if (value) {
											if (typeof Map !== "undefined") {
												assert.equal(originalMap, Map, "libjass.Map did not default to the runtime's implementation.");
											}

											libjass.Map = null;
											assert.isNotNull(libjass.Map, "libjass.Map actually got set to null instead of SimpleSet.");

											if (typeof Map !== "undefined") {
												assert.notEqual(libjass.Map, originalMap, "libjass.Map is still the runtime's implementation of Map.");
											}
										}

										assert.isFunction(libjass.Promise, "libjass.Promise is not a function.");

										originalPromise = libjass.Promise;

										if (value) {
											if (typeof Promise !== "undefined") {
												assert.equal(originalPromise, Promise, "libjass.Promise did not default to the runtime's implementation.");
											}

											libjass.Promise = null;
											assert.isNotNull(libjass.Promise, "libjass.Promise actually got set to null instead of SimpleSet.");

											if (typeof Promise !== "undefined") {
												assert.notEqual(libjass.Promise, originalPromise, "libjass.Promise is still the runtime's implementation of Promise.");
											}
										}

										resolve();
									}
									catch (ex) {
										reject(ex);
									}
								});
							});
						},
						after: function (value) {
							return new DojoPromise(function (resolve, reject) {
								require(["intern/chai!assert", "lib/libjass"], function (assert, libjass) {
									try {
										libjass.Set = originalSet;
										assert.equal(libjass.Set, originalSet, "libjass.Set did not get reset to the original value.");

										libjass.Map = originalMap;
										assert.equal(libjass.Map, originalMap, "libjass.Map did not get reset to the original value.");

										libjass.Promise = originalPromise;
										assert.equal(libjass.Promise, originalPromise, "libjass.Promise did not get reset to the original value.");

										resolve();
									}
									catch (ex) {
										reject(ex);
									}
								});
							});
						},
					};
				})(),
			},
			onPermutation: function (permutation) {
				console.log("Running permutation:", permutation);
				return true;
			}
		},
	};

	if (intern.args.minified === "true") {
		result.loaderConfig = {
			map: {
				"*": {
					"lib/libjass": "lib/libjass.min",
					"lib/libjass.js": "lib/libjass.min.js",
				}
			}
		};
	}

	return result;
});
