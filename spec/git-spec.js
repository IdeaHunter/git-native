/* eslint max-nested-callbacks:0 */
'use strict';

let _ = require('underscore');
let exec = require('child_process').exec;
let fs = require('fs-plus');
let git = require('bindings')('git');
let path = require('path');
let temp = require('temp');
let wrench = require('wrench');

let execCommands = function (commands, callback) {
    let command;
    if (process.platform === 'win32') {
        command = commands.join(' & ');
    } else {
        command = commands.join(' && ');
    }
    return exec(command, callback);
};

let tmp = function () {
    return temp.mkdirSync('node-git-tmp-');
};

let valitGitRepo = 'git://github.com/IdeaHunter/test';
let invalidGitRepo = 'git://github.com/IdeaHunter/notexists';
let notExistingPath = '/tmp/path/does/not/exist';
let invalidPath = '/tmp/notvalid/path?{}[]';

describe('git', function () {
    describe('.clone(url,path)', function () {
        describe('when url valid', function () {
            describe('and path is valid and not exists', function () {
                let tmpPath = tmp();
                let repo = git.clone(valitGitRepo, tmpPath);
                it('would return a promise', function () {
                    expect(repo instanceof Promise).toBe(true);
                });
                it('would resolve the promise', function (done) {
                    repo.then(done, done.fail);
                });
                it('would checkout file', function () {
                    expect(fs.isFileSync(path.join(tmpPath, 'README.md'))).toBe(true);
                });
            });
            describe('and path is invalid', function () {
                let repo = git.clone(valitGitRepo, invalidPath);
                it('would return a promise', function () {
                    expect(repo instanceof Promise).toBe(true);
                });
                it('would reject the promise', function (done) {
                    repo.then(done.fail, done);
                });
            });
        });
        describe('when url invalid', function () {
            let repo = git.clone(invalidGitRepo, tmp());
            it('would return a promise', function () {
                expect(repo instanceof Promise).toBe(true);
            });
            it('would reject the promise', function (done) {
                repo.then(done.fail, done);
            });
        });
    });
    describe('.open(path)', function () {
        describe('when the path is a repository', function () {
            it('returns a promise', function () {
                expect(git.open(__dirname) instanceof Promise).toBe(true);
            });
            it('returned promise would be resolved', function (done) {
                git.open(__dirname).then(done, done.fail);
            });
        });
        describe('when the path isn\'t a repository', function () {
            it('returns a promse', function () {
                expect(git.open(notExistingPath) instanceof Promise).toBe(true);
            });
            it('returned promise would be rejected', function (done) {
                git.open(notExistingPath).then(done.fail, done);
            });
        });
    });
    describe('.getPath()', function () {
        it('returns the path to the .git directory', function (done) {
            git.open(__dirname).then(function (repo) {
                let repositoryPath = path.resolve(repo.getPath());
                let currentGitPath = path.resolve(path.dirname(__dirname), '.git/');
                expect(repositoryPath).toBe(currentGitPath);
                done();
            }, done.fail);
        });
    });
    describe('.getWorkingDirectory()', function () {
        it('returns the path to the working directory', function (done) {
            git.open(__dirname).then(function (repo) {
                let workingDirectory = path.resolve(repo.getWorkingDirectory());
                let cwd = path.dirname(__dirname);
                expect(workingDirectory).toBe(cwd);
                done();
            }, done.fail);
        });
    });
    describe('.getHead()', function () {
        describe('when a branch is checked out', function () {
            it('returns the branch\'s full path', function (done) {
                let dir = path.join(__dirname, 'fixtures/master.git');
                git.open(dir).then(function (repo) {
                    expect(repo.getHead()).toBe('refs/heads/master');
                    done();
                }, done.fail);
            });
        });
        describe('when the HEAD is detached', function () {
            it('return the SHA-1 that is checked out', function (done) {
                let dir = path.join(__dirname, 'fixtures/detached.git');
                git.open(dir).then(function (repo) {
                    expect(repo.getHead()).toBe('50719ab369dcbbc2fb3b7a0167c52accbd0eb40e');
                    done();
                }, done.fail);
            });
        });
    });
    describe('.isIgnored(path)', function () {
        let ref = [];
        let ignoreRepoRoot = ref[0];
        let ignoreRepoDir = ref[1];
        beforeEach(function () {
            ignoreRepoRoot = temp.mkdirSync('ignore-dir');
            ignoreRepoDir = path.join(ignoreRepoRoot, 'ignored');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/ignored-workspace/'), ignoreRepoDir);
            return wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/ignored.git'), path.join(ignoreRepoDir, '.git'));
        });
        afterEach(function () {
            return wrench.rmdirSyncRecursive(ignoreRepoRoot);
        });
        describe('when the path is undefined', function () {
            it('return false', function (done) {
                git.open(ignoreRepoDir).then(function (repo) {
                    expect(repo.isIgnored()).toBe(false);
                    done();
                }, done.fail);
            });
        });
        describe('when the path is ignored', function () {
            it('returns true', function (done) {
                git.open(ignoreRepoDir).then(function (repo) {
                    expect(repo.isIgnored('a.txt')).toBe(true);
                    expect(repo.isIgnored('subdir/subdir')).toBe(true);
                    done();
                }, done.fail);
            });
        });
        describe('when the path is not ignored', function () {
            it('return false', function (done) {
                git.open(ignoreRepoDir).then(function (repo) {
                    expect(repo.isIgnored('b.txt')).toBe(false);
                    expect(repo.isIgnored('subdir')).toBe(false);
                    expect(repo.isIgnored('subdir/yak.txt')).toBe(false);
                    done();
                }, done.fail);
            });
        });
    });
    describe('.isSubmodule(path)', function () {
        let submodulePath = path.join(__dirname, 'fixtures/submodule.git');
        describe('when the path is undefined', function () {
            it('return false', function (done) {
                git.open(submodulePath).then(function (repo) {
                    expect(repo.isSubmodule()).toBe(false);
                    done();
                }, done.fail);
            });
        });
        describe('when the path is a submodule', function () {
            it('returns true', function (done) {
                git.open(submodulePath).then(function (repo) {
                    expect(repo.isSubmodule('a')).toBe(true);
                    done();
                }, done.fail);
            });
        });
        describe('when the path is not a submodule', function () {
            it('return false', function (done) {
                git.open(submodulePath).then(function (repo) {
                    expect(repo.isSubmodule('b')).toBe(false);
                    done();
                }, done.fail);
            });
        });
    });
    describe('.getConfigValue(key)', function () {
        it('returns the value for the key', function (done) {
            let masterPath = path.join(__dirname, 'fixtures/master.git');
            git.open(masterPath).then(function (repo) {
                expect(repo.getConfigValue('core.repositoryformatversion')).toBe('0');
                expect(repo.getConfigValue('core.ignorecase')).toBe('true');
                expect(repo.getConfigValue('not.section')).toBe(null);
                done();
            }, done.fail);
        });
    });
    describe('.setConfigValue(key, value)', function () {
        let repoDirectory;
        beforeEach(function () {
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            return repoDirectory;
        });
        it('sets the key to the value in the config', function (done) {
            git.open(repoDirectory).then(function (repo) {
                expect(repo.setConfigValue()).toBe(false);
                expect(repo.setConfigValue('1')).toBe(false);
                expect(repo.setConfigValue('a.b', 'test')).toBe(true);
                expect(repo.getConfigValue('a.b')).toBe('test');
                expect(repo.setConfigValue('a.b.c', 'foo')).toBe(true);
                expect(repo.getConfigValue('a.b.c')).toBe('foo');
                done();
            }, done.fail);
        });
    });
    describe('.checkoutReference(reference, [create])', function () {
        let repoDirectory = null;
        let repo;
        beforeEach(function (done) {
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/references.git'), path.join(repoDirectory, '.git'));
            git.open(repoDirectory).then(function (res) {
                repo = res;
                expect(repo.getHead()).toBe('refs/heads/master');
                done();
            }, done.fail);
        });
        describe('when a local reference exists', function () {
            it('checks a branch out if passed a short reference', function () {
                expect(repo.checkoutReference('getHeadOriginal')).toBe(true);
                expect(repo.getHead()).toBe('refs/heads/getHeadOriginal');
            });
            it('checks a branch out if passed a long reference', function () {
                expect(repo.checkoutReference('refs/heads/getHeadOriginal')).toBe(true);
                expect(repo.getHead()).toBe('refs/heads/getHeadOriginal');
            });
            it('does not check a branch out if the dirty tree interferes', function (done) {
                fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'README.md'), 'great words', 'utf8');
                execCommands([ 'cd ' + repoDirectory, 'git add .', 'git commit -m \'comitting\'' ], function () {
                    expect(repo.checkoutReference('refs/heads/getHeadOriginal')).toBe(true);
                    fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'README.md'), 'more words', 'utf8');
                    expect(repo.checkoutReference('refs/heads/master')).toBe(false);
                    expect(repo.getHead()).toBe('refs/heads/getHeadOriginal');
                    done();
                });
            });
            it('does check a branch out if the dirty tree does not interfere', function () {
                fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'new_file.md'), 'a new file', 'utf8');
                expect(repo.checkoutReference('refs/heads/getHeadOriginal')).toBe(true);
            });
        });
        describe('when a local reference doesn\'t exist', function () {
            it('does nothing if branch creation was not specified', function () {
                expect(repo.checkoutReference('refs/heads/whoop-whoop')).toBe(false);
            });
            it('creates the new branch (if asked to)', function () {
                expect(repo.checkoutReference('refs/heads/whoop-whoop', true)).toBe(true);
                expect(repo.getHead()).toBe('refs/heads/whoop-whoop');
            });
            it('does nothing if the new branch is malformed (even if asked to)', function () {
                expect(repo.checkoutReference('refs/heads/inv@{id', true)).toBe(false);
                expect(repo.getHead()).toBe('refs/heads/master');
            });
            describe('when a short reference is passed', function () {
                it('does nothing if branch creation was not specified', function () {
                    expect(repo.checkoutReference('bananas')).toBe(false);
                });
                it('creates the new branch (if asked to)', function () {
                    expect(repo.checkoutReference('bananas', true)).toBe(true);
                    expect(repo.getHead()).toBe('refs/heads/bananas');
                });
            });
        });
    });
    describe('.checkoutHead(path)', function () {
        let repo;
        beforeEach(function (done) {
            let repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            git.open(repoDirectory).then(function (res) {
                repo = res;
                expect(repo.getHead()).toBe('refs/heads/master');
                done();
            }, done.fail);
        });
        describe('when the path exists', function () {
            it('replaces the file contents with the HEAD revision and returns true', function () {
                let filePath = path.join(repo.getWorkingDirectory(), 'a.txt');
                fs.writeFileSync(filePath, 'changing a.txt', 'utf8');
                expect(repo.checkoutHead('a.txt')).toBe(true);
                let lineEnding = process.platform === 'win32' ? '\r\n' : '\n';
                expect(fs.readFileSync(filePath, 'utf8')).toBe('first line' + lineEnding);
            });
        });
        describe('when the path is undefined', function () {
            it('returns false', function () {
                expect(repo.checkoutHead()).toBe(false);
            });
        });
    });
    describe('.getReferences()', function () {
        it('returns a list of all the references', function (done) {
            let referencesObj;
            referencesObj = {
                heads: [ 'refs/heads/diff-lines', 'refs/heads/getHeadOriginal', 'refs/heads/master' ],
                remotes: [ 'refs/remotes/origin/getHeadOriginal', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/master', 'refs/remotes/upstream/HEAD', 'refs/remotes/upstream/master' ],
                tags: [ 'refs/tags/v1.0', 'refs/tags/v2.0' ]
            };
            let refPath = path.join(__dirname, 'fixtures/references.git');
            git.open(refPath).then(function (repo) {
                expect(repo.getReferences()).toEqual(referencesObj);
                done();
            }, done.fail);
        });
    });
    describe('.getReferenceTarget(branch)', function () {
        it('returns the SHA-1 for a reference', function (done) {
            let masterPath = path.join(__dirname, 'fixtures/master.git');
            git.open(masterPath).then(function (repo) {
                expect(repo.getReferenceTarget('HEAD2')).toBe(null);
                expect(repo.getReferenceTarget('HEAD')).toBe('b2c96bdffe1a8f239c2d450863e4a6caa6dcb655');
                expect(repo.getReferenceTarget('refs/heads/master')).toBe('b2c96bdffe1a8f239c2d450863e4a6caa6dcb655');
                done();
            }, done.fail);
        });
    });
    describe('.getDiffStats(path)', function () {
        let repo;
        beforeEach(function (done) {
            let repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            git.open(repoDirectory).then(function (res) {
                repo = res;
                done();
            }, done.fail);
        });
        describe('when the path is deleted', function () {
            it('returns of number of lines deleted', function () {
                expect(repo.getDiffStats('a.txt')).toEqual({
                    added: 0,
                    deleted: 1
                });
            });
        });
        describe('when the path is modified', function () {
            it('returns the number of lines added and deleted', function () {
                let filePath;
                filePath = path.join(repo.getWorkingDirectory(), 'a.txt');
                fs.writeFileSync(filePath, 'changing\na.txt', 'utf8');
                expect(repo.getDiffStats('a.txt')).toEqual({
                    added: 2,
                    deleted: 1
                });
            });
        });
        describe('when the path is new', function () {
            it('returns that no lines were added or deleted', function () {
                let filePath;
                filePath = path.join(repo.getWorkingDirectory(), 'b.txt');
                fs.writeFileSync(filePath, 'changing\nb.txt\nwith lines', 'utf8');
                expect(repo.getDiffStats('b.txt')).toEqual({
                    added: 0,
                    deleted: 0
                });
            });
        });
        describe('when the repository has no HEAD', function () {
            it('returns that no lines were added and deleted', function (done) {
                let repoDirectory;
                repoDirectory = temp.mkdirSync('node-git-repo-');
                wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
                git.open(repoDirectory).then(function (innerRepo) {
                    fs.unlinkSync(path.join(repoDirectory, '.git/HEAD'));
                    expect(innerRepo.getDiffStats('b.txt')).toEqual({
                        added: 0,
                        deleted: 0
                    });
                    done();
                }, done.fail);
            });
        });
    });
    describe('.getHeadBlob(path)', function () {
        let repo;
        beforeEach(function (done) {
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            git.open(repoDirectory).then(function (res) {
                repo = res;
                done();
            }, done.fail);
        });
        describe('when the path is modified', function () {
            it('returns the HEAD blob contents', function () {
                let filePath;
                filePath = path.join(repo.getWorkingDirectory(), 'a.txt');
                fs.writeFileSync(filePath, 'changing\na.txt', 'utf8');
                expect(repo.getHeadBlob('a.txt')).toBe('first line\n');
            });
        });
        describe('when the path is not modified', function () {
            it('returns the HEAD blob contents', function () {
                expect(repo.getHeadBlob('a.txt')).toBe('first line\n');
            });
        });
        describe('when the path does not exist', function () {
            it('returns null', function () {
                expect(repo.getHeadBlob('i-do-not-exist.txt')).toBeNull();
            });
        });
    });
    describe('.getIndexBlob(path)', function () {
        let repo;
        let repoDirectory;
        beforeEach(function (done) {
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            git.open(repoDirectory).then(function (res) {
                repo = res;
                done();
            }, done.fail);
        });
        describe('when the path is staged', function () {
            it('returns the index blob contents', function (done) {
                let filePath;
                expect(repo.getIndexBlob('a.txt')).toBe('first line\n');
                filePath = path.join(repo.getWorkingDirectory(), 'a.txt');
                fs.writeFileSync(filePath, 'changing\na.txt', 'utf8');
                expect(repo.getIndexBlob('a.txt')).toBe('first line\n');
                execCommands([ 'cd ' + repoDirectory, 'git add a.txt' ], function () {
                    expect(repo.getIndexBlob('a.txt')).toBe('changing\na.txt');
                    done();
                });
            });
        });
        describe('when the path is not staged', function () {
            it('returns the index blob contents', function () {
                let filePath;
                expect(repo.getIndexBlob('a.txt')).toBe('first line\n');
                filePath = path.join(repo.getWorkingDirectory(), 'a.txt');
                fs.writeFileSync(filePath, 'changing\na.txt', 'utf8');
                expect(repo.getIndexBlob('a.txt')).toBe('first line\n');
            });
        });
        describe('when the path does not exist', function () {
            it('returns null', function () {
                expect(repo.getIndexBlob('i-do-not-exist.txt')).toBeNull();
            });
        });
    });
    describe('.getStatus([path])', function () {
        let repo;
        beforeEach(function (done) {
            let repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            git.open(repoDirectory).then(function (res) {
                repo = res;
                let newFilePath = path.join(repo.getWorkingDirectory(), 'b.txt');
                fs.writeFileSync(newFilePath, '', 'utf8');
                let ignoreFile = path.join(repo.getWorkingDirectory(), '.git/info/exclude');
                fs.writeFileSync(ignoreFile, 'c.txt', 'utf8');
                let ignoredFilePath = path.join(repo.getWorkingDirectory(), 'c.txt');
                fs.writeFileSync(ignoredFilePath, '', 'utf8');
                done();
            }, done.fail);
        });
        describe('when no path is specified', function () {
            it('returns the status of all modified paths', function () {
                let statuses;
                statuses = repo.getStatus();
                expect(_.keys(statuses).length).toBe(2);
                expect(statuses['a.txt']).toBe(1 << 9);
                expect(statuses['b.txt']).toBe(1 << 7);
            });
        });
        describe('when a path is specified', function () {
            it('returns the status of the given path', function () {
                expect(repo.getStatus('a.txt')).toBe(1 << 9);
            });
        });
    });
    describe('.getStatusForPaths([paths])', function () {
        let repo;
        beforeEach(function (done) {
            let repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            git.open(repoDirectory).then(function (res) {
                repo = res;
                let newDir = path.join(repo.getWorkingDirectory(), 'secret-stuff');
                fs.mkdirSync(newDir);
                let newFilePath = path.join(newDir, 'b.txt');
                fs.writeFileSync(newFilePath, '', 'utf8');
                done();
            }, done.fail);
        });
        describe('when a path is specified', function () {
            it('returns the status of only that path', function () {
                let statuses;
                statuses = repo.getStatusForPaths([ 'secret-stuff' ]);
                expect(_.keys(statuses).length).toBe(1);
                expect(statuses['secret-stuff/b.txt']).toBe(1 << 7);
            });
        });
        describe('when no path is specified', function () {
            it('returns an empty object', function () {
                let statuses;
                statuses = repo.getStatusForPaths();
                expect(_.keys(statuses).length).toBe(0);
            });
        });
        describe('when an empty array is specified', function () {
            it('returns an empty object', function () {
                let statuses;
                statuses = repo.getStatusForPaths([]);
                expect(_.keys(statuses).length).toBe(0);
            });
        });
        describe('when an empty string is specified', function () {
            it('returns an empty object', function () {
                let statuses;
                statuses = repo.getStatusForPaths([ '' ]);
                expect(_.keys(statuses).length).toBe(0);
            });
        });
    });
    describe('.getLineDiffs(path, text, options)', function () {
        it('returns all hunks that differ', function (done) {
            let masterPath = path.join(__dirname, 'fixtures/master.git');
            git.open(masterPath).then(function (repo) {
                let diffs = repo.getLineDiffs('a.txt', 'first line is different');
                expect(diffs.length).toBe(1);
                expect(diffs[0].oldStart).toBe(1);
                expect(diffs[0].oldLines).toBe(1);
                expect(diffs[0].newStart).toBe(1);
                expect(diffs[0].newLines).toBe(1);
                diffs = repo.getLineDiffs('a.txt', 'first line\nsecond line');
                expect(diffs.length).toBe(1);
                expect(diffs[0].oldStart).toBe(1);
                expect(diffs[0].oldLines).toBe(0);
                expect(diffs[0].newStart).toBe(2);
                expect(diffs[0].newLines).toBe(1);
                diffs = repo.getLineDiffs('a.txt', '');
                expect(diffs.length).toBe(1);
                expect(diffs[0].oldStart).toBe(1);
                expect(diffs[0].oldLines).toBe(1);
                expect(diffs[0].newStart).toBe(0);
                expect(diffs[0].newLines).toBe(0);
                done();
            }, done.fail);
        });
        it('returns null for paths that don\'t exist', function (done) {
            let masterPath = path.join(__dirname, 'fixtures/master.git');
            git.open(masterPath).then(function (repo) {
                let diffs = repo.getLineDiffs('i-dont-exists.txt', 'content');
                expect(diffs).toBeNull();
                done();
            }, done.fail);
        });
        describe('ignoreEolWhitespace option', function () {
            it('ignores eol of line whitespace changes', function (done) {
                let wsPath = path.join(__dirname, 'fixtures/whitespace.git');
                git.open(wsPath).then(function (repo) {
                    let diffs = repo.getLineDiffs('file.txt', 'first\r\nsecond\r\nthird\r\n', {
                        ignoreEolWhitespace: false
                    });
                    expect(diffs.length).toBe(1);
                    diffs = repo.getLineDiffs('file.txt', 'first\r\nsecond\r\nthird\r\n', {
                        ignoreEolWhitespace: true
                    });
                    expect(diffs.length).toBe(0);
                    done();
                }, done.fail);
            });
        });
        describe('useIndex options', function () {
            it('uses the index version instead of the HEAD version for diffs', function (done) {
                let repoDirectory = temp.mkdirSync('node-git-repo-');
                wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
                git.open(repoDirectory).then(function (repo) {
                    let diffs = repo.getLineDiffs('a.txt', 'first line is different', {
                        useIndex: true
                    });
                    expect(diffs.length).toBe(1);
                    let filePath = path.join(repo.getWorkingDirectory(), 'a.txt');
                    fs.writeFileSync(filePath, 'first line is different', 'utf8');
                    execCommands([ 'cd ' + repoDirectory, 'git add a.txt' ], function () {
                        diffs = repo.getLineDiffs('a.txt', 'first line is different', {
                            useIndex: true
                        });
                        expect(diffs.length).toBe(0);
                        diffs = repo.getLineDiffs('a.txt', 'first line is different', {
                            useIndex: false
                        });
                        expect(diffs.length).toBe(1);
                        done();
                    });
                }, done.fail);
            });
        });
    });
    describe('.getLineDiffDetails(path, text, options)', function () {
        it('returns all relevant lines in a diff', function (done) {
            let isOldLine = function (diff) {
                return diff.oldLineNumber >= 0 && diff.newLineNumber === -1;
            };
            let isNewLine = function (diff) {
                return diff.oldLineNumber === -1 && diff.newLineNumber >= 0;
            };

            let masterPath = path.join(__dirname, 'fixtures/master.git');
            git.open(masterPath).then(function (repo) {
                let diffs = repo.getLineDiffDetails('a.txt', 'first line is different');
                expect(diffs.length).toBe(3);
                expect(isOldLine(diffs[0])).toBe(true);
                expect(diffs[0].line).toEqual('first line\n');
                expect(isNewLine(diffs[1])).toBe(true);
                expect(diffs[1].line).toEqual('first line is different');
                diffs = repo.getLineDiffDetails('a.txt', 'first line\nsecond line');
                expect(diffs.length).toBe(2);
                expect(isNewLine(diffs[0])).toBe(true);
                expect(diffs[0].line).toEqual('second line');
                diffs = repo.getLineDiffDetails('a.txt', '');
                expect(diffs.length).toBe(1);
                expect(isOldLine(diffs[0])).toBe(true);
                expect(diffs[0].line).toEqual('first line\n');
                done();
            }, done.fail);
        });
        it('returns null for paths that don\'t exist', function (done) {
            let masterPath = path.join(__dirname, 'fixtures/master.git');
            git.open(masterPath).then(function (repo) {
                let diffs = repo.getLineDiffDetails('i-dont-exists.txt', 'content');
                expect(diffs).toBeNull();
                done();
            }, done.fail);
        });
        describe('ignoreEolWhitespace option', function () {
            it('ignores eol of line whitespace changes', function (done) {
                let wsPath = path.join(__dirname, 'fixtures/whitespace.git');
                git.open(wsPath).then(function (repo) {
                    let diffs = repo.getLineDiffDetails('file.txt', 'first\r\nsecond\r\nthird\r\n', {
                        ignoreEolWhitespace: false
                    });
                    expect(diffs.length).toBe(6);
                    diffs = repo.getLineDiffs('file.txt', 'first\r\nsecond\r\nthird\r\n', {
                        ignoreEolWhitespace: true
                    });
                    expect(diffs.length).toBe(0);
                    done();
                }, done.fail);
            });
        });
        describe('useIndex options', function () {
            it('uses the index version instead of the HEAD version for diffs', function (done) {
                let repoDirectory = temp.mkdirSync('node-git-repo-');
                wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));

                git.open(repoDirectory).then(function (repo) {
                    let diffs = repo.getLineDiffDetails('a.txt', 'first line is different', {
                        useIndex: true
                    });
                    expect(diffs.length).toBe(3);
                    let filePath = path.join(repo.getWorkingDirectory(), 'a.txt');
                    fs.writeFileSync(filePath, 'first line is different', 'utf8');
                    execCommands([ 'cd ' + repoDirectory, 'git add a.txt' ], function () {
                        diffs = repo.getLineDiffDetails('a.txt', 'first line is different', {
                            useIndex: true
                        });
                        expect(diffs.length).toBe(0);
                        diffs = repo.getLineDiffDetails('a.txt', 'first line is different', {
                            useIndex: false
                        });
                        expect(diffs.length).toBe(3);
                        done();
                    });
                }, done.fail);
            });
        });
    });
    describe('.add(path)', function () {
        let repo;
        beforeEach(function (done) {
            let repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            git.open(repoDirectory).then(function (res) {
                repo = res;
                let filePath = path.join(repoDirectory, 'toadd.txt');
                fs.writeFileSync(filePath, 'changes to stage', 'utf8');
                done();
            }, done.fail);
        });
        it('introduces the current state of the file to the index', function () {
            expect(repo.getStatus('toadd.txt')).toBe(1 << 7);
            repo.add('toadd.txt');
            expect(repo.getStatus('toadd.txt')).toBe(1 << 0);
        });
        it('throws an error if the file doesn\'t exist', function () {
            expect(function () {
                return repo.add('missing.txt');
            }).toThrow();
        });
    });
});
