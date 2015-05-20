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

import * as fs from "fs";
import * as path from "path";
import { Readable, Transform } from "stream";

export interface File {
	path: string;
	contents: string | Buffer;
}

export function src(files: string | string[], options?: { relativeTo?: string }): Readable<File> {
	if (!Array.isArray(files)) {
		files = [<string>files];
	}

	return new FileSource(<string[]>files, (options && options.relativeTo) ? path.resolve(options.relativeTo) : process.cwd());
}

export function dest(base: string): Transform<File | Error, File | Error> {
	return new FileDest(base);
}

export function watch(directory: string, onChangeCallback: () => void): FileWatcher {
	var fileWatcher = new FileWatcher(onChangeCallback);

	var entries = fs.readdirSync(directory);
	for (let entry of entries) {
		var entryName = path.join(directory, entry);
		var stats = fs.statSync(entryName);
		if (stats.isFile()) {
			fileWatcher.watchFile(entryName);
		}
	}

	return fileWatcher;
}

export class FileWatcher {
	private _watchedFiles = Object.create(null);
	private _modifiedFiles = Object.create(null);
	private _pendingCall: number = null;

	constructor(private _onChangeCallback: (fileNames: string[]) => void) { }

	watchFile(fileName: string): void {
		if (fileName in this._watchedFiles) {
			return;
		}

		var watchFileCallback = (currentFile: fs.Stats, previousFile: fs.Stats) => {
			if (currentFile.mtime.getTime() <= 0) {
				this._fileChangedCallback(fileName);
				fs.unwatchFile(fileName, watchFileCallback);
				delete this._watchedFiles[fileName];
			}
			else {
				this._fileChangedCallback(fileName);
			}
		};

		fs.watchFile(fileName, { interval: 500 }, watchFileCallback);
		this._watchedFiles[fileName] = true;
	}

	private _fileChangedCallback(fileName: string): void {
		this._modifiedFiles[fileName] = true;

		if (this._pendingCall === null) {
			this._pendingCall = setTimeout(() => {
				this._pendingCall = null;

				var modifiedFiles = Object.keys(this._modifiedFiles);

				for (let fileName of modifiedFiles) {
					delete this._modifiedFiles[fileName];
				}

				this._onChangeCallback(modifiedFiles);
			}, 100);
		}
	}
}

export class FileTransform extends Transform<File | Error, File | Error> {
	constructor(transform?: (chunk: File, encoding?: string, callback?: (error?: Error) => void) => void, flush?: (callback?: (error?: Error) => void) => void) {
		super({ objectMode: true });

		transform = transform || ((chunk, encoding, callback) => callback());

		var originalTransform = (transform.length < 3) ?
			(chunk: File, encoding: string, callback: (error: Error) => void) => {
				try {
					transform.call(this, chunk, encoding);
					callback(null);
				}
				catch (ex) {
					callback(ex);
				}
			} :
			transform.bind(this);

		this._transform = (chunk: File | Error, encoding: string, callback: (error?: Error) => void) => {
			if (chunk instanceof Error) {
				this.push(chunk);

				callback(null);
			}
			else {
				originalTransform(chunk, encoding, (err: Error) => {
					if (err) {
						this.push(err);
					}

					callback(null);
				});
			}
		};

		flush = flush || (callback => callback());

		if (flush.length < 1) {
			this._flush = ((callback: (error?: Error) => void) => {
				try {
					flush.call(this);
					callback(null);
				}
				catch (ex) {
					callback(ex);
				}
			});
		}
		else {
			this._flush = flush.bind(this);
		}
	}
}

class FileSource extends Readable<File | Error> {
	private _numRead: number = 0;

	constructor(private _files: string[], private _relativeTo: string) {
		super({ objectMode: true });
	}

	_read() {
		if (this._numRead >= this._files.length) {
			this.push(null);
			return;
		}

		var filename = this._files[this._numRead++];
		fs.readFile(filename, { encoding: "utf8" }, (err, data) => {
			if (err) {
				this.push(err);
				this._numRead = this._files.length;
				return;
			}

			this.push({ path: path.relative(this._relativeTo, filename), contents: data });
		});
	}
}

class FileDest extends Transform<File | Error, File | Error> {
	constructor(private _base: string) {
		super({ objectMode: true });
	}

	_transform(chunk: File | Error, encoding: string, callback: (error: Error) => void) {
		if (chunk instanceof Error) {
			callback(chunk);
			return;
		}

		var file = <File>chunk;
		var outputPath = path.join(this._base, path.relative(process.cwd(), file.path));
		mkdirp(path.dirname(outputPath), err => {
			if (err) {
				callback(err);
				return;
			}

			fs.writeFile(outputPath, file.contents, { encoding: "utf8" }, err => {
				if (err) {
					callback(err);
					return;
				}

				this.push(file);
				callback(null);
			});
		});
	}
}

function mkdirp(directory: string, callback: (error: any) => void) {
	fs.mkdir(directory, err => {
		if (err) {
			if (err.code === "ENOENT") {
				var parent = path.dirname(directory);
				if (parent !== directory) {
					mkdirp(parent, err => {
						if (err) {
							callback(err);
							return;
						}

						mkdirp(directory, callback);
					});
				}
				else {
					callback(new Error("Root does not exist."));
				}
			}
			else if (err.code === "EEXIST") {
				fs.stat(directory, (err, stats) => {
					if (err) {
						callback(err);
						return;
					}

					if (!stats.isDirectory()) {
						callback(new Error(directory + " already exists and is not a directory."));
						return;
					}

					callback(null);
				});
			}
			else {
				callback(err);
			}

			return;
		}

		callback(null);
	});
}
