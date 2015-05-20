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

var fs = require("fs");
var async = require("async");

async.series([function (callback) {
	async.every(["./build/typescript/index.js", "./build/doc.js"], fs.exists.bind(fs), function (allExist) {
		if (allExist) {
			callback(null);
			return;
		}

		var npm = require("npm");

		npm.load(function () {
			npm.commands["run-script"](["build"], callback);
		});
	});
}, function (callback) {


var path = require("path");
var stream = require("stream");

var task = require("./build/task");

(function () {
	var _helpers = null;
	var _TypeScript = null;
	var _UglifyJS = null;
	var _npm = null;

	Object.defineProperties(global, {
		helpers: { get: function () { return _helpers || (_helpers = require("./build/helpers")); } },
		src: { get: function () { return helpers.src; } },
		dest: { get: function () { return helpers.dest; } },
		watch: { get: function () { return helpers.watch; } },
		FileTransform: { get: function () { return helpers.FileTransform; } },

		TypeScript: { get: function () { return _TypeScript || (_TypeScript = require("./build/typescript/index.js")); } },
		UglifyJS: { get: function () { return _UglifyJS || (_UglifyJS = require("./build/uglify.js")); } },
		npm: { get: function () { return _npm || (_npm = require("npm")); } },
	});
})();

task("default", ["libjass.js", "libjass.min.js"]);

task("libjass.js", function (callback) {
	fs.exists("./lib/libjass.js", function (exists) {
		if (exists) {
			callback(null, null);
			return;
		}

		callback(null, src("./src/tsconfig.json")
			.pipe(TypeScript.build("./src/index.ts", "libjass"))
			.pipe(UglifyJS.build("./src/index", "libjass", ["BorderStyle", "ClockEvent", "Format", "WorkerCommands", "WrappingStyle"]))
			.pipe(dest("./lib")));
	});
});

task("libjass.min.js", ["libjass.js"], function (callback) {
	fs.exists("./lib/libjass.min.js", function (exists) {
		if (exists) {
			callback(null, null);
			return;
		}

		callback(null, src(["./lib/libjass.js", "./lib/libjass.js.map"], { relativeTo: "./lib" })
			.pipe(UglifyJS.minify())
			.pipe(dest("./lib")));
	});
});

task("clean", clean(["./lib/libjass.js", "./lib/libjass.js.map", "./lib/libjass.min.js", "./lib/libjass.min.js.map"]));

task("watch", ["clean", "test-create-encoded-firefox-profile"], function (callback) {
	npm.load(function () {
		var testRunning = false;
		var rerunTest = false;

		var startTest = function () {
			npm.commands["run-script"](["test-lib"], function () {
				testRunning = false;

				if (rerunTest) {
					startTest();
					rerunTest = false;
				}
			});

			testRunning = true;
		};

		var runTest = function () {
			if (!testRunning) {
				startTest();
			}
			else {
				rerunTest = true;
			}
		};

		src("./src/tsconfig.json")
			.pipe(TypeScript.watch("./src/index.ts", "libjass"))
			.pipe(UglifyJS.watch("./src/index", "libjass", ["BorderStyle", "ClockEvent", "Format", "WorkerCommands", "WrappingStyle"]))
			.pipe(dest("./lib"))
			.pipe(new FileTransform(function (file) {
				if (file.path === "libjass.js") {
					runTest();
				}
			}));

		watch("./tests/unit/", runTest);
	});
});

task("test-create-encoded-firefox-profile", function (callback) {
	fs.exists("./tests/support/encoded-firefox-profile.txt", function (exists) {
		if (exists) {
			callback(null, null);
			return;
		}

		try {
			var FirefoxProfile = require("firefox-profile");
			var firefoxProfile = new FirefoxProfile();

			firefoxProfile.setPreference("browser.displayedE10SPrompt.1", 5);
			firefoxProfile.setPreference("browser.tabs.remote.autostart.2", false);

			firefoxProfile.encoded(function (encodedProfile) {
				fs.writeFile("./tests/support/encoded-firefox-profile.txt", encodedProfile, callback);
			});
		}
		catch (ex) {
			callback(ex, null);
		}
	});
});

task("test-lib", ["libjass.js", "test-create-encoded-firefox-profile"], function (callback) {
	npm.load(function () {
		npm.commands["run-script"](["test-lib"], callback);
	});
});

task("test-minified", ["libjass.min.js", "test-create-encoded-firefox-profile"], function (callback) {
	npm.load(function () {
		npm.commands["run-script"](["test-minified"], callback);
	});
});

// Start Selenium server with
//    java.exe -jar .\selenium-server-standalone-2.45.0.jar "-Dwebdriver.ie.driver=$PWD\IEDriverServer.exe" "-Dwebdriver.chrome.driver=$PWD\chromedriver.exe"
task("test-browser", ["libjass.js", "test-create-encoded-firefox-profile"], function (callback) {
	npm.load(function () {
		npm.commands["run-script"](["test-browser"], callback);
	});
});

task("test", ["test-lib", "test-minified"]);

task("demo", ["libjass.js"], function () {
	return src(["./lib/libjass.js", "./lib/libjass.js.map", "./lib/libjass.css"], { relativeTo: "./lib" }).pipe(dest("../libjass-gh-pages/demo/"));
});

task("doc", ["make-doc", "test-doc"]);

task("make-doc", function () {
	var Doc = require("./build/doc.js");

	return src("./src/tsconfig.json")
		.pipe(Doc.build("./api.xhtml", "./src/index.ts", "libjass"))
		.pipe(dest("../libjass-gh-pages/"));
});

task("test-doc", ["make-doc", "libjass.js"], function (callback) {
	npm.load(function () {
		npm.commands["run-script"](["test-doc"], callback);
	});
});

task("dist", ["clean", "libjass.js", "libjass.min.js", "test", "test-browser", "demo", "doc"], function (callback) {
	var inputFiles = [
		"./README.md", "./CHANGELOG.md", "./LICENSE",
		"./lib/libjass.js", "./lib/libjass.js.map",
		"./lib/libjass.min.js", "./lib/libjass.min.js.map",
		"./lib/libjass.css"
	];

	var files = Object.create(null);
	inputFiles.forEach(function (filename) {
		files["./dist/" + path.basename(filename)] = filename;
	});

	async.series([
		// Clean dist/
		clean(Object.keys(files).concat(["./dist/package.json"])),

		// Create dist/ if necessary
		function (callback) {
			fs.mkdir("./dist", function (err) {
				if (err && err.code !== "EEXIST") {
					callback(err);
					return;
				}

				callback(null);
			});
		},

		// Copy all files except package.json
		async.each.bind(async, Object.keys(files), function (outputFilename, callback) {
			async.waterfall([fs.readFile.bind(fs, files[outputFilename]), fs.writeFile.bind(fs, outputFilename)], callback);
		}),

		// Copy package.json
		async.waterfall.bind(async, [
			fs.readFile.bind(fs, "./package.json"),
			function (data, callback) {
				try {
					var packageJson = JSON.parse(data);
					packageJson.devDependencies = undefined;
					packageJson.private = undefined;
					packageJson.scripts = undefined;
					packageJson.main = "libjass.js";
				}
				catch (ex) {
					callback(ex, null);
					return;
				}

				callback(null, new Buffer(JSON.stringify(packageJson, null, "\t")));
			},
			fs.writeFile.bind(fs, "./dist/package.json")
		])
	], callback);
});

function clean(files) {
	return async.each.bind(async, files, function (file, callback) {
		fs.unlink(file, function (err) {
			if (err && err.code !== "ENOENT") {
				callback(err);
				return;
			}

			callback(null);
		});
	});
}

task.runArgv(callback);


}]);
