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

var stream = require("stream");

var async = require("async");

var allTasks = Object.create(null);

function handleSyncBody(body) {
	return function (callback) {
		try {
			var result = body();
		}
		catch (ex) {
			callback(ex, null);
			return;
		}

		callback(null, result);
	};
}

function handleTaskResult(result, callback) {
	if (arguments.length === 1) {
		callback = result;
		result = null;
	}

	if (result instanceof stream.Transform) {
		result.on("data", function () { });
		result.on("end", function () {
			callback(null);
		});
		result.on("error", function (err) {
			callback(err);
		});
	}
	else {
		callback(null);
	}
}

function task(name, deps, body) {
	if (arguments.length < 3) {
		if (Array.isArray(deps)) {
			body = function () { };
		}
		else {
			body = deps;
			deps = [];
		}
	}

	if (body.length === 0) {
		body = handleSyncBody(body);
	}

	var originalBody = body;
	body = function (callback) {
		console.log("[" + new Date().toLocaleTimeString() + "] " + name + " - Starting");

		async.waterfall([originalBody, handleTaskResult], function (err) {
			if (err) {
				console.error("[" + new Date().toLocaleTimeString() + "] " + name + " - Failed");
				callback(err, null);
				return;
			}

			console.log("[" + new Date().toLocaleTimeString() + "] " + name + " - Succeeded");
			callback(null);
		});
	};

	allTasks[name] = { name: name, deps: deps, body: body };
}

task.runArgv = function (callback) {
	var tasksToRun;
	if (process.argv.length > 2) {
		tasksToRun = process.argv.slice(2);
	}
	else {
		tasksToRun = ["default"];
	}

	var tasks = Object.create(null);
	var walkDeps = function (task) {
		task = allTasks[task];

		if (task.name in tasks) {
			return;
		}

		tasks[task.name] = task.deps.concat(task.body);
		task.deps.forEach(walkDeps);
	};
	tasksToRun.forEach(walkDeps);

	async.auto(tasks, function (err, results) {
		if (err) {
			console.error(err.stack || err);
			process.exit(1);
		}
	}, callback);
};

module.exports = task;
