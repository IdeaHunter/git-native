/* eslint max-nested-callbacks:0 */
'use strict';

let _ = require('underscore');
let exec = require('fs-plus');
let execCommands;
let fs = require('fs-plus');
let git = require('../src/git');
let path = require('path');
let temp = require('temp');
let wrench = require('wrench');

execCommands = function (commands, callback) {
    let command;
    if (process.platform === 'win32') {
        command = commands.join(' & ');
    } else {
        command = commands.join(' && ');
    }
    return exec(command, callback);
};

describe('git', function () {
    let repo;
    repo = null;
    afterEach(function () {
        return repo !== null ? repo.release() : undefined;
    });
    describe('.open(path)', function () {
        describe('when the path is a repository', function () {
            it('returns a repository', function () {
                expect(git.open(__dirname)).not.toBeNull();
            });
        });
        describe('when the path isn\'t a repository', function () {
            it('returns null', function () {
                expect(git.open('/tmp/path/does/not/exist')).toBeNull();
            });
        });
    });
    describe('.getPath()', function () {
        it('returns the path to the .git directory', function () {
            let repositoryPath = git.open(__dirname).getPath();
            let currentGitPath = path.join(path.dirname(__dirname), '.git/');
            if (process.platform === 'win32') {
                currentGitPath = currentGitPath.replace(/\\/g, '/');
            }
            expect(repositoryPath).toBe(currentGitPath);
        });
    });
    describe('.getWorkingDirectory()', function () {
        it('returns the path to the working directory', function () {
            let workingDirectory = git.open(__dirname).getWorkingDirectory();
            let cwd = path.dirname(__dirname);
            if (process.platform === 'win32') {
                cwd = cwd.replace(/\\/g, '/');
            }
            expect(workingDirectory).toBe(cwd);
        });
    });
    describe('.getHead()', function () {
        describe('when a branch is checked out', function () {
            it('returns the branch\'s full path', function () {
                repo = git.open(path.join(__dirname, 'fixtures/master.git'));
                expect(repo.getHead()).toBe('refs/heads/master');
            });
        });
        describe('when the HEAD is detached', function () {
            it('return the SHA-1 that is checked out', function () {
                repo = git.open(path.join(__dirname, 'fixtures/detached.git'));
                expect(repo.getHead()).toBe('50719ab369dcbbc2fb3b7a0167c52accbd0eb40e');
            });
        });
    });
    describe('.getShortHead()', function () {
        describe('when a branch is checked out', function () {
            it('returns the branch\'s name', function () {
                repo = git.open(path.join(__dirname, 'fixtures/master.git'));
                expect(repo.getShortHead()).toBe('master');
            });
        });
        describe('when the HEAD is detached', function () {
            it('return the abbreviated SHA-1 that is checked out', function () {
                repo = git.open(path.join(__dirname, 'fixtures/detached.git'));
                expect(repo.getShortHead()).toBe('50719ab');
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
            it('return false', function () {
                repo = git.open(ignoreRepoDir);
                expect(repo.isIgnored()).toBe(false);
            });
        });
        describe('when the path is ignored', function () {
            it('returns true', function () {
                repo = git.open(ignoreRepoDir);
                expect(repo.isIgnored('a.txt')).toBe(true);
                expect(repo.isIgnored('subdir/subdir')).toBe(true);
            });
        });
        describe('when the path is not ignored', function () {
            it('return false', function () {
                repo = git.open(ignoreRepoDir);
                expect(repo.isIgnored('b.txt')).toBe(false);
                expect(repo.isIgnored('subdir')).toBe(false);
                expect(repo.isIgnored('subdir/yak.txt')).toBe(false);
            });
        });
    });
    describe('.isSubmodule(path)', function () {
        describe('when the path is undefined', function () {
            it('return false', function () {
                repo = git.open(path.join(__dirname, 'fixtures/submodule.git'));
                expect(repo.isSubmodule()).toBe(false);
            });
        });
        describe('when the path is a submodule', function () {
            it('returns true', function () {
                repo = git.open(path.join(__dirname, 'fixtures/submodule.git'));
                expect(repo.isSubmodule('a')).toBe(true);
            });
        });
        describe('when the path is not a submodule', function () {
            it('return false', function () {
                repo = git.open(path.join(__dirname, 'fixtures/submodule.git'));
                expect(repo.isSubmodule('b')).toBe(false);
            });
        });
    });
    describe('.getConfigValue(key)', function () {
        it('returns the value for the key', function () {
            repo = git.open(path.join(__dirname, 'fixtures/master.git'));
            expect(repo.getConfigValue('core.repositoryformatversion')).toBe('0');
            expect(repo.getConfigValue('core.ignorecase')).toBe('true');
            expect(repo.getConfigValue('not.section')).toBe(null);
        });
    });
    describe('.setConfigValue(key, value)', function () {
        beforeEach(function () {
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            return repo;
        });
        it('sets the key to the value in the config', function () {
            expect(repo.setConfigValue()).toBe(false);
            expect(repo.setConfigValue('1')).toBe(false);
            expect(repo.setConfigValue('a.b', 'test')).toBe(true);
            expect(repo.getConfigValue('a.b')).toBe('test');
            expect(repo.setConfigValue('a.b.c', 'foo')).toBe(true);
            expect(repo.getConfigValue('a.b.c')).toBe('foo');
        });
    });
    describe('.isPathModified(path)', function () {
        beforeEach(function () {
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            return repo;
        });
        describe('when a path is deleted', function () {
            it('returns true', function () {
                expect(repo.isPathModified('a.txt')).toBe(true);
            });
        });
        describe('when a path is modified', function () {
            it('returns true', function () {
                fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'a.txt'), 'changing a.txt', 'utf8');
                expect(repo.isPathModified('a.txt')).toBe(true);
            });
        });
        describe('when a path is new', function () {
            it('returns false', function () {
                fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'new.txt'), 'new', 'utf8');
                expect(repo.isPathModified('new.txt')).toBe(false);
            });
        });
    });
    describe('.isPathDeleted(path)', function () {
        beforeEach(function () {
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            return repo;
        });
        describe('when a path is deleted', function () {
            it('returns true', function () {
                expect(repo.isPathDeleted('a.txt')).toBe(true);
            });
        });
        describe('when a path is modified', function () {
            it('returns false', function () {
                fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'a.txt'), 'changing a.txt', 'utf8');
                expect(repo.isPathDeleted('a.txt')).toBe(false);
            });
        });
        describe('when a path is new', function () {
            it('returns false', function () {
                fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'new.txt'), 'new', 'utf8');
                expect(repo.isPathDeleted('new.txt')).toBe(false);
            });
        });
    });
    describe('.isPathNew(path)', function () {
        beforeEach(function () {
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            return repo;
        });
        describe('when a path is deleted', function () {
            it('returns false', function () {
                expect(repo.isPathNew('a.txt')).toBe(false);
            });
        });
        describe('when a path is modified', function () {
            it('returns false', function () {
                fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'a.txt'), 'changing a.txt', 'utf8');
                expect(repo.isPathNew('a.txt')).toBe(false);
            });
        });
        describe('when a path is new', function () {
            it('returns true', function () {
                fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'new.txt'), 'new', 'utf8');
                expect(repo.isPathNew('new.txt')).toBe(true);
            });
        });
    });
    describe('isPathStaged(path)', function () {
        let repoDirectory;
        repoDirectory = [][0];
        beforeEach(function () {
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            return repo;
        });
        describe('when a path is new and staged', function () {
            it('returns true ', function () {
                fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'new.txt'), 'new', 'utf8');
                expect(repo.isPathStaged('new.txt')).toBe(false);
                repo.add('new.txt');
                expect(repo.isPathStaged('new.txt')).toBe(true);
            });
        });
        describe('when a path is modified and staged', function () {
            it('returns true ', function () {
                fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'a.txt'), 'changing a.txt', 'utf8');
                expect(repo.isPathStaged('a.txt')).toBe(false);
                repo.add('a.txt');
                expect(repo.isPathStaged('a.txt')).toBe(true);
            });
        });
        describe('when a path is deleted and staged', function () {
            it('returns true ', function () {
                let gitCommandHandler;
                expect(repo.isPathStaged('a.txt')).toBe(false);
                gitCommandHandler = jasmine.createSpy('gitCommandHandler');
                execCommands([ 'cd ' + repoDirectory, 'git rm -f a.txt' ], gitCommandHandler);
                waitsFor(function () {
                    return gitCommandHandler.callCount === 1;
                });
                runs(function () {
                    expect(repo.isPathStaged('a.txt')).toBe(true);
                });
            });
        });
    });
    describe('.isStatusIgnored(status)', function () {
        it('returns true when the status is ignored, false otherwise', function () {
            let repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/ignored.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            let ignoreFile = path.join(repo.getWorkingDirectory(), '.git/info/exclude');
            fs.writeFileSync(ignoreFile, 'c.txt');
            fs.writeFileSync(path.join(repoDirectory, 'c.txt'), '');
            expect(repo.isStatusIgnored(repo.getStatus('c.txt'))).toBe(true);
            expect(repo.isStatusIgnored(repo.getStatus('b.txt'))).toBe(false);
            expect(repo.isStatusIgnored()).toBe(false);
        });
    });
    describe('.getUpstreamBranch()', function () {
        describe('when no upstream branch exists', function () {
            it('returns null', function () {
                repo = git.open(path.join(__dirname, 'fixtures/master.git'));
                expect(repo.getUpstreamBranch()).toBe(null);
            });
        });
        describe('when an upstream branch exists', function () {
            it('returns the full path to the branch', function () {
                repo = git.open(path.join(__dirname, 'fixtures/upstream.git'));
                expect(repo.getUpstreamBranch()).toBe('refs/remotes/origin/master');
            });
        });
    });
    describe('.checkoutReference(reference, [create])', function () {
        let repoDirectory;
        repoDirectory = null;
        beforeEach(function () {
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/references.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            expect(repo.getHead()).toBe('refs/heads/master');
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
            it('does not check a branch out if the dirty tree interferes', function () {
                let gitCommandHandler;
                fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'README.md'), 'great words', 'utf8');
                gitCommandHandler = jasmine.createSpy('gitCommandHandler');
                execCommands([ 'cd ' + repoDirectory, 'git add .', 'git commit -m \'comitting\'' ], gitCommandHandler);
                waitsFor(function () {
                    return gitCommandHandler.callCount === 1;
                });
                runs(function () {
                    expect(repo.checkoutReference('refs/heads/getHeadOriginal')).toBe(true);
                    fs.writeFileSync(path.join(repo.getWorkingDirectory(), 'README.md'), 'more words', 'utf8');
                    expect(repo.checkoutReference('refs/heads/master')).toBe(false);
                    expect(repo.getHead()).toBe('refs/heads/getHeadOriginal');
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
        beforeEach(function () {
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            return repo;
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
        it('returns a list of all the references', function () {
            let referencesObj;
            referencesObj = {
                heads: [ 'refs/heads/diff-lines', 'refs/heads/getHeadOriginal', 'refs/heads/master' ],
                remotes: [ 'refs/remotes/origin/getHeadOriginal', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/master', 'refs/remotes/upstream/HEAD', 'refs/remotes/upstream/master' ],
                tags: [ 'refs/tags/v1.0', 'refs/tags/v2.0' ]
            };
            repo = git.open(path.join(__dirname, 'fixtures/references.git'));
            expect(repo.getReferences()).toEqual(referencesObj);
        });
    });
    describe('.getReferenceTarget(branch)', function () {
        it('returns the SHA-1 for a reference', function () {
            repo = git.open(path.join(__dirname, 'fixtures/master.git'));
            expect(repo.getReferenceTarget('HEAD2')).toBe(null);
            expect(repo.getReferenceTarget('HEAD')).toBe('b2c96bdffe1a8f239c2d450863e4a6caa6dcb655');
            expect(repo.getReferenceTarget('refs/heads/master')).toBe('b2c96bdffe1a8f239c2d450863e4a6caa6dcb655');
        });
    });
    describe('.getDiffStats(path)', function () {
        beforeEach(function () {
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            return repo;
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
            it('returns that no lines were added and deleted', function () {
                let repoDirectory;
                repoDirectory = temp.mkdirSync('node-git-repo-');
                wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
                repo = git.open(repoDirectory);
                fs.unlinkSync(path.join(repoDirectory, '.git/HEAD'));
                expect(repo.getDiffStats('b.txt')).toEqual({
                    added: 0,
                    deleted: 0
                });
            });
        });
    });
    describe('.getHeadBlob(path)', function () {
        beforeEach(function () {
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            return repo;
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
        let ref = [];
        repo = ref[0];
        let repoDirectory = ref[1];
        beforeEach(function () {
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            return repo;
        });
        describe('when the path is staged', function () {
            it('returns the index blob contents', function () {
                let filePath;
                let gitCommandHandler;
                expect(repo.getIndexBlob('a.txt')).toBe('first line\n');
                filePath = path.join(repo.getWorkingDirectory(), 'a.txt');
                fs.writeFileSync(filePath, 'changing\na.txt', 'utf8');
                expect(repo.getIndexBlob('a.txt')).toBe('first line\n');
                gitCommandHandler = jasmine.createSpy('gitCommandHandler');
                execCommands([ 'cd ' + repoDirectory, 'git add a.txt' ], gitCommandHandler);
                waitsFor(function () {
                    return gitCommandHandler.callCount === 1;
                });
                runs(function () {
                    expect(repo.getIndexBlob('a.txt')).toBe('changing\na.txt');
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
        beforeEach(function () {
            let ignoreFile;
            let ignoredFilePath;
            let newFilePath;
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            newFilePath = path.join(repo.getWorkingDirectory(), 'b.txt');
            fs.writeFileSync(newFilePath, '', 'utf8');
            ignoreFile = path.join(repo.getWorkingDirectory(), '.git/info/exclude');
            fs.writeFileSync(ignoreFile, 'c.txt', 'utf8');
            ignoredFilePath = path.join(repo.getWorkingDirectory(), 'c.txt');
            return fs.writeFileSync(ignoredFilePath, '', 'utf8');
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
        beforeEach(function () {
            let newDir;
            let newFilePath;
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            newDir = path.join(repo.getWorkingDirectory(), 'secret-stuff');
            fs.mkdirSync(newDir);
            newFilePath = path.join(newDir, 'b.txt');
            return fs.writeFileSync(newFilePath, '', 'utf8');
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
    describe('.getAheadBehindCount()', function () {
        beforeEach(function () {
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/ahead-behind.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            return repo;
        });
        it('returns the number of commits ahead of and behind the upstream branch', function () {
            let counts;
            counts = repo.getAheadBehindCount();
            expect(counts).toEqual({
                ahead: 3,
                behind: 2
            });
            counts = repo.getAheadBehindCount('refs/heads/master');
            expect(counts).toEqual({
                ahead: 3,
                behind: 2
            });
            counts = repo.getAheadBehindCount('master');
            expect(counts).toEqual({
                ahead: 3,
                behind: 2
            });
            counts = repo.getAheadBehindCount('refs/heads/masterblaster');
            expect(counts).toEqual({
                ahead: 0,
                behind: 0
            });
            counts = repo.getAheadBehindCount('');
            expect(counts).toEqual({
                ahead: 0,
                behind: 0
            });
        });
    });
    describe('.getLineDiffs(path, text, options)', function () {
        it('returns all hunks that differ', function () {
            let diffs;
            repo = git.open(path.join(__dirname, 'fixtures/master.git'));
            diffs = repo.getLineDiffs('a.txt', 'first line is different');
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
        });
        it('returns null for paths that don\'t exist', function () {
            let diffs;
            repo = git.open(path.join(__dirname, 'fixtures/master.git'));
            diffs = repo.getLineDiffs('i-dont-exists.txt', 'content');
            expect(diffs).toBeNull();
        });
        describe('ignoreEolWhitespace option', function () {
            it('ignores eol of line whitespace changes', function () {
                let diffs;
                repo = git.open(path.join(__dirname, 'fixtures/whitespace.git'));
                diffs = repo.getLineDiffs('file.txt', 'first\r\nsecond\r\nthird\r\n', {
                    ignoreEolWhitespace: false
                });
                expect(diffs.length).toBe(1);
                diffs = repo.getLineDiffs('file.txt', 'first\r\nsecond\r\nthird\r\n', {
                    ignoreEolWhitespace: true
                });
                expect(diffs.length).toBe(0);
            });
        });
        describe('useIndex options', function () {
            it('uses the index version instead of the HEAD version for diffs', function () {
                let diffs;
                let filePath;
                let gitCommandHandler;
                let repoDirectory;
                repoDirectory = temp.mkdirSync('node-git-repo-');
                wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
                repo = git.open(repoDirectory);
                diffs = repo.getLineDiffs('a.txt', 'first line is different', {
                    useIndex: true
                });
                expect(diffs.length).toBe(1);
                filePath = path.join(repo.getWorkingDirectory(), 'a.txt');
                fs.writeFileSync(filePath, 'first line is different', 'utf8');
                gitCommandHandler = jasmine.createSpy('gitCommandHandler');
                execCommands([ 'cd ' + repoDirectory, 'git add a.txt' ], gitCommandHandler);
                waitsFor(function () {
                    return gitCommandHandler.callCount === 1;
                });
                runs(function () {
                    diffs = repo.getLineDiffs('a.txt', 'first line is different', {
                        useIndex: true
                    });
                    expect(diffs.length).toBe(0);
                    diffs = repo.getLineDiffs('a.txt', 'first line is different', {
                        useIndex: false
                    });
                    expect(diffs.length).toBe(1);
                });
            });
        });
    });
    describe('.getLineDiffDetails(path, text, options)', function () {
        it('returns all relevant lines in a diff', function () {
            let diffs;
            let isNewLine;
            let isOldLine;
            repo = git.open(path.join(__dirname, 'fixtures/master.git'));
            isOldLine = function (diff) {
                return diff.oldLineNumber >= 0 && diff.newLineNumber === -1;
            };
            isNewLine = function (diff) {
                return diff.oldLineNumber === -1 && diff.newLineNumber >= 0;
            };
            diffs = repo.getLineDiffDetails('a.txt', 'first line is different');
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
        });
        it('returns null for paths that don\'t exist', function () {
            let diffs;
            repo = git.open(path.join(__dirname, 'fixtures/master.git'));
            diffs = repo.getLineDiffDetails('i-dont-exists.txt', 'content');
            expect(diffs).toBeNull();
        });
        describe('ignoreEolWhitespace option', function () {
            it('ignores eol of line whitespace changes', function () {
                let diffs;
                repo = git.open(path.join(__dirname, 'fixtures/whitespace.git'));
                diffs = repo.getLineDiffDetails('file.txt', 'first\r\nsecond\r\nthird\r\n', {
                    ignoreEolWhitespace: false
                });
                expect(diffs.length).toBe(6);
                diffs = repo.getLineDiffs('file.txt', 'first\r\nsecond\r\nthird\r\n', {
                    ignoreEolWhitespace: true
                });
                expect(diffs.length).toBe(0);
            });
        });
        describe('useIndex options', function () {
            it('uses the index version instead of the HEAD version for diffs', function () {
                let diffs;
                let filePath;
                let gitCommandHandler;
                let repoDirectory;
                repoDirectory = temp.mkdirSync('node-git-repo-');
                wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
                repo = git.open(repoDirectory);
                diffs = repo.getLineDiffDetails('a.txt', 'first line is different', {
                    useIndex: true
                });
                expect(diffs.length).toBe(3);
                filePath = path.join(repo.getWorkingDirectory(), 'a.txt');
                fs.writeFileSync(filePath, 'first line is different', 'utf8');
                gitCommandHandler = jasmine.createSpy('gitCommandHandler');
                execCommands([ 'cd ' + repoDirectory, 'git add a.txt' ], gitCommandHandler);
                waitsFor(function () {
                    return gitCommandHandler.callCount === 1;
                });
                runs(function () {
                    diffs = repo.getLineDiffDetails('a.txt', 'first line is different', {
                        useIndex: true
                    });
                    expect(diffs.length).toBe(0);
                    diffs = repo.getLineDiffDetails('a.txt', 'first line is different', {
                        useIndex: false
                    });
                    expect(diffs.length).toBe(3);
                });
            });
        });
    });
    describe('.relativize(path)', function () {
        it('relativizes the given path to the working directory of the repository', function () {
            let workingDirectory;
            repo = git.open(__dirname);
            workingDirectory = repo.getWorkingDirectory();
            expect(repo.relativize(path.join(workingDirectory, 'a.txt'))).toBe('a.txt');
            expect(repo.relativize(path.join(workingDirectory, 'a/b/c.txt'))).toBe('a/b/c.txt');
            expect(repo.relativize('a.txt')).toBe('a.txt');
            expect(repo.relativize('/not/in/working/dir')).toBe('/not/in/working/dir');
            expect(repo.relativize(null)).toBe(null);
            expect(repo.relativize()).toBeUndefined();
            expect(repo.relativize('')).toBe('');
            expect(repo.relativize(workingDirectory)).toBe('');
        });
        describe('when the opened path is a symlink', function () {
            it('relativizes against both the linked path and the real path', function () {
                let linkDirectory;
                let repoDirectory;
                if (process.platform === 'win32') {
                    return;
                }
                repoDirectory = fs.realpathSync(temp.mkdirSync('node-git-repo-'));
                linkDirectory = path.join(fs.realpathSync(temp.mkdirSync('node-git-repo-')), 'link');
                wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
                fs.symlinkSync(repoDirectory, linkDirectory);
                repo = git.open(linkDirectory);
                expect(repo.relativize(path.join(repoDirectory, 'test1'))).toBe('test1');
                expect(repo.relativize(path.join(linkDirectory, 'test2'))).toBe('test2');
                expect(repo.relativize(path.join(linkDirectory, 'test2/test3'))).toBe('test2/test3');
                expect(repo.relativize('test2/test3')).toBe('test2/test3');
            });
        });
        it('handles case insensitive filesystems', function () {
            let linkDirectory;
            let repoDirectory;
            let workingDirectory;
            repoDirectory = temp.mkdirSync('lower-case-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            repo.caseInsensitiveFs = true;
            workingDirectory = repo.getWorkingDirectory();
            expect(repo.relativize(path.join(workingDirectory.toUpperCase(), 'a.txt'))).toBe('a.txt');
            expect(repo.relativize(path.join(workingDirectory.toUpperCase(), 'a/b/c.txt'))).toBe('a/b/c.txt');
            linkDirectory = path.join(fs.realpathSync(temp.mkdirSync('lower-case-symlink')), 'link');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            fs.symlinkSync(repoDirectory, linkDirectory);
            repo = git.open(linkDirectory);
            repo.caseInsensitiveFs = true;
            expect(repo.relativize(path.join(linkDirectory.toUpperCase(), 'test2'))).toBe('test2');
            expect(repo.relativize(path.join(linkDirectory.toUpperCase(), 'test2/test3'))).toBe('test2/test3');
        });
    });
    describe('.isWorkingDirectory(path)', function () {
        it('returns whether the given path is the repository\'s working directory', function () {
            let repoDirectory;
            let workingDirectory;
            repo = git.open(__dirname);
            workingDirectory = repo.getWorkingDirectory();
            expect(repo.isWorkingDirectory(workingDirectory)).toBe(true);
            expect(repo.isWorkingDirectory()).toBe(false);
            expect(repo.isWorkingDirectory(null)).toBe(false);
            expect(repo.isWorkingDirectory('')).toBe(false);
            expect(repo.isWorkingDirectory('test')).toBe(false);
            repoDirectory = temp.mkdirSync('lower-case-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            repo.caseInsensitiveFs = true;
            workingDirectory = repo.getWorkingDirectory();
            expect(repo.isWorkingDirectory(workingDirectory.toUpperCase())).toBe(true);
        });
    });
    describe('.submoduleForPath(path)', function () {
        beforeEach(function () {
            let gitCommandHandler;
            let repoDirectory;
            let submoduleDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            submoduleDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures', 'master.git'), path.join(repoDirectory, '.git'));
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures', 'master.git'), path.join(submoduleDirectory, '.git'));
            gitCommandHandler = jasmine.createSpy('gitCommandHandler');
            execCommands([ 'cd ' + repoDirectory, 'git submodule add ' + submoduleDirectory + ' sub' ], gitCommandHandler);
            waitsFor(function () {
                return gitCommandHandler.callCount === 1;
            });
            runs(function () {
                repo = git.open(repoDirectory);
                return repo;
            });
        });
        it('returns the repository for the path', function () {
            let submoduleRepoPath;
            expect(repo.submoduleForPath()).toBe(null);
            expect(repo.submoduleForPath(null)).toBe(null);
            expect(repo.submoduleForPath('')).toBe(null);
            expect(repo.submoduleForPath('sub1')).toBe(null);
            submoduleRepoPath = path.join(repo.getPath(), 'modules', 'sub/');
            if (process.platform === 'win32') {
                submoduleRepoPath = submoduleRepoPath.replace(/\\/g, '/');
            }
            expect(repo.submoduleForPath('sub').getPath()).toBe(submoduleRepoPath);
            expect(repo.submoduleForPath('sub/').getPath()).toBe(submoduleRepoPath);
            expect(repo.submoduleForPath('sub/a').getPath()).toBe(submoduleRepoPath);
            expect(repo.submoduleForPath('sub/a/b/c/d').getPath()).toBe(submoduleRepoPath);
        });
    });
    describe('.add(path)', function () {
        beforeEach(function () {
            let filePath;
            let repoDirectory;
            repoDirectory = temp.mkdirSync('node-git-repo-');
            wrench.copyDirSyncRecursive(path.join(__dirname, 'fixtures/master.git'), path.join(repoDirectory, '.git'));
            repo = git.open(repoDirectory);
            filePath = path.join(repoDirectory, 'toadd.txt');
            return fs.writeFileSync(filePath, 'changes to stage', 'utf8');
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
