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

var libjass = require("../../lib/libjass.js");
var parserTest = require("../parser-test.js");

suite("Primitives", function () {
	suite("Color", function () {
		test("Starts with &H", parserTest("&H3F171F&", "color", new libjass.parts.Color(31, 23, 63, 1)));

		test("Starts with H", parserTest("&3F171F&", "color", new libjass.parts.Color(31, 23, 63, 1)));

		test("Less than six digits", parserTest("&H71F&", "color", new libjass.parts.Color(31, 7, 0, 1)));

		test("Eight digits", parserTest("&H3F171F00&", "color", new libjass.parts.Color(0, 31, 23, 1)));

		test("Eight digits", parserTest("&H3F171FFF&", "color", new libjass.parts.Color(255, 31, 23, 1)));

		test("More than eight digits", parserTest("&HAAAA3F171F00&", "color", new libjass.parts.Color(255, 255, 255, 1)));

		test("More than eight digits", parserTest("&HAAAA3F171FFF&", "color", new libjass.parts.Color(255, 255, 255, 1)));
	});

	suite("Alpha", function () {
		test("Starts with &H", parserTest("&HFF&", "alpha", 0));

		test("Starts with &", parserTest("&FF&", "alpha", 0));

		test("Starts with &H, one digit", parserTest("&HF&", "alpha", 1 - 15 / 255));

		test("Starts with &H, one digit", parserTest("&H0&", "alpha", 1));

		test("Starts with &, one digit", parserTest("&F&", "alpha", 1 - 15 / 255));

		test("Starts with &, one digit", parserTest("&0&", "alpha", 1));

		test("Starts with &H, doesn't end with &", parserTest("&HF&", "alpha", 1 - 15 / 255));

		test("Starts with &H, doesn't end with &", parserTest("&H0&", "alpha", 1));

		test("Starts with &, doesn't end with &", parserTest("&F", "alpha", 1 - 15 / 255));

		test("Starts with &, doesn't end with &", parserTest("&0", "alpha", 1));

		test("Doesn't start with &, doesn't end with &", parserTest("0", "alpha", 1));

		test("Starts with H", parserTest("H0", "alpha", 1));
	});

	suite("ColorWithAlpha", function () {
		test("Starts with &H", parserTest("&H00434441", "colorWithAlpha", new libjass.parts.Color(65, 68, 67, 1)));

		test("Starts with &H, non-zero alpha", parserTest("&HF0434441", "colorWithAlpha", new libjass.parts.Color(65, 68, 67, 1 - 240 / 255)));

		test("Starts with &H, zero alpha", parserTest("&HFF434441", "colorWithAlpha", new libjass.parts.Color(65, 68, 67, 0)));

		test("Less than six digits", parserTest("&H71F", "colorWithAlpha", new libjass.parts.Color(31, 7, 0, 1)));

		test("Eight digits", parserTest("&H3F171F00", "colorWithAlpha", new libjass.parts.Color(0, 31, 23, 1 - 63 / 255)));

		test("Eight digits", parserTest("&H3F171FFF", "colorWithAlpha", new libjass.parts.Color(255, 31, 23, 1 - 63 / 255)));

		test("More than eight digits", parserTest("&HAAAA3F171F00", "colorWithAlpha", new libjass.parts.Color(255, 255, 255, 0)));

		test("More than eight digits", parserTest("&HAAAA3F171FFF", "colorWithAlpha", new libjass.parts.Color(255, 255, 255, 0)));
	});
});
