'use strict';

let nodepath = require('path');
let fs = require('fs-plus');
let Repository = require('../build/Release/git.node').Repository;
let statusIndexNew = 1 << 0;
let statusIndexModified = 1 << 1;
let statusIndexDeleted = 1 << 2;
let statusIndexRenamed = 1 << 3;
let statusIndexTypeChange = 1 << 4;
let statusWorkingDirNew = 1 << 7;
let statusWorkingDirModified = 1 << 8;
let statusWorkingDirDelete = 1 << 9;
let statusWorkingDirTypeChange = 1 << 10;
let statusIgnored = 1 << 14;

let modifiedStatusFlags = statusWorkingDirModified |
    statusIndexModified |
    statusWorkingDirDelete |
    statusIndexDeleted |
    statusWorkingDirTypeChange |
    statusIndexTypeChange;

let newStatusFlags = statusWorkingDirNew | statusIndexNew;

let deletedStatusFlags = statusWorkingDirDelete | statusIndexDeleted;

let indexStatusFlags = statusIndexNew |
    statusIndexModified |
    statusIndexDeleted |
    statusIndexRenamed |
    statusIndexTypeChange;

Repository.prototype.release = function () {
    let ref = this.submodules;
    for (let submodulePath in ref) {
        if (!ref.hasOwnProperty(submodulePath))
            continue;

        let submoduleRepo = ref[submodulePath];
        if (submoduleRepo !== null) {
            submoduleRepo.release();
        }
    }
    return this._release();
};

Repository.prototype.getWorkingDirectory = function () {
    let ref;
    return this.workingDirectory !== null
        ? this.workingDirectory
        : this.workingDirectory =
            (ref = this._getWorkingDirectory()) !== null
                ? ref.replace(/\/$/, '')
                : undefined;
};

Repository.prototype.getShortHead = function () {
    let head;
    head = this.getHead();
    if (head === null) {
        return head;
    }
    if (head.indexOf('refs/heads/') === 0) {
        return head.substring(11);
    }
    if (head.indexOf('refs/tags/') === 0) {
        return head.substring(10);
    }
    if (head.indexOf('refs/remotes/') === 0) {
        return head.substring(13);
    }
    if (head.match(/[a-fA-F0-9]{40}/)) {
        return head.substring(0, 7);
    }
    return head;
};

Repository.prototype.isStatusModified = function (status) {
    if (status === null) {
        status = 0;
    }
    return (status & modifiedStatusFlags) > 0;
};

Repository.prototype.isPathModified = function (path) {
    return this.isStatusModified(this.getStatus(path));
};

Repository.prototype.isStatusNew = function (status) {
    if (status === null) {
        status = 0;
    }
    return (status & newStatusFlags) > 0;
};

Repository.prototype.isPathNew = function (path) {
    return this.isStatusNew(this.getStatus(path));
};

Repository.prototype.isStatusDeleted = function (status) {
    if (status === null) {
        status = 0;
    }
    return (status & deletedStatusFlags) > 0;
};

Repository.prototype.isPathDeleted = function (path) {
    return this.isStatusDeleted(this.getStatus(path));
};

Repository.prototype.isPathStaged = function (path) {
    return this.isStatusStaged(this.getStatus(path));
};

Repository.prototype.isStatusIgnored = function (status) {
    if (status === null) {
        status = 0;
    }
    return (status & statusIgnored) > 0;
};

Repository.prototype.isStatusStaged = function (status) {
    if (status === null) {
        status = 0;
    }
    return (status & indexStatusFlags) > 0;
};

Repository.prototype.getUpstreamBranch = function (branch) {
    if (branch === null) {
        branch = this.getHead();
    }
    if (!((branch !== null ? branch.length : undefined) > 11)) {
        return null;
    }
    if (branch.indexOf('refs/heads/') !== 0) {
        return null;
    }
    let shortBranch = branch.substring(11);
    let branchMerge = this.getConfigValue('branch.' + shortBranch + '.merge');
    if (!((branchMerge !== null ? branchMerge.length : undefined) > 11)) {
        return null;
    }
    if (branchMerge.indexOf('refs/heads/') !== 0) {
        return null;
    }
    let branchRemote = this.getConfigValue('branch.' + shortBranch + '.remote');
    if (!((branchRemote !== null ? branchRemote.length : undefined) > 0)) {
        return null;
    }
    return 'refs/remotes/' + branchRemote + '/' + branchMerge.substring(11);
};

Repository.prototype.getAheadBehindCount = function (branch) {
    if (branch === null) {
        branch = 'HEAD';
    }
    if (branch !== 'HEAD' && branch.indexOf('refs/heads/') !== 0) {
        branch = 'refs/heads/' + branch;
    }
    let counts = {
        ahead: 0,
        behind: 0
    };
    let headCommit = this.getReferenceTarget(branch);
    if (!((headCommit !== null ? headCommit.length : undefined) > 0)) {
        return counts;
    }
    let upstream = this.getUpstreamBranch();
    if (!((upstream !== null ? upstream.length : undefined) > 0)) {
        return counts;
    }
    let upstreamCommit = this.getReferenceTarget(upstream);
    if (!((upstreamCommit !== null ? upstreamCommit.length : undefined) > 0)) {
        return counts;
    }
    let mergeBase = this.getMergeBase(headCommit, upstreamCommit);
    if (!((mergeBase !== null ? mergeBase.length : undefined) > 0)) {
        return counts;
    }
    counts.ahead = this.getCommitCount(headCommit, mergeBase);
    counts.behind = this.getCommitCount(upstreamCommit, mergeBase);
    return counts;
};

Repository.prototype.checkoutReference = function (branch, create) {
    if (branch.indexOf('refs/heads/') !== 0) {
        branch = 'refs/heads/' + branch;
    }
    return this.checkoutRef(branch, create);
};

Repository.prototype.relativize = function (path) {
    if (!path) {
        return path;
    }
    if (process.platform === 'win32') {
        path = path.replace(/\\/g, '/');
    } else if (path[0] !== '/') {
        return path;
    }
    if (this.caseInsensitiveFs) {
        let lowerCasePath = path.toLowerCase();
        let workingDirectory = this.getWorkingDirectory();
        if (workingDirectory) {
            workingDirectory = workingDirectory.toLowerCase();
            if (lowerCasePath.indexOf(workingDirectory + '/') === 0) {
                return path.substring(workingDirectory.length + 1);
            } else if (lowerCasePath === workingDirectory) {
                return '';
            }
        }
        if (this.openedWorkingDirectory) {
            workingDirectory = this.openedWorkingDirectory.toLowerCase();
            if (lowerCasePath.indexOf(workingDirectory + '/') === 0) {
                return path.substring(workingDirectory.length + 1);
            } else if (lowerCasePath === workingDirectory) {
                return '';
            }
        }
    } else {
        let workingDirectory = this.getWorkingDirectory();
        if (workingDirectory) {
            if (path.indexOf(workingDirectory + '/') === 0) {
                return path.substring(workingDirectory.length + 1);
            } else if (path === workingDirectory) {
                return '';
            }
        }
        if (this.openedWorkingDirectory) {
            if (path.indexOf(this.openedWorkingDirectory + '/') === 0) {
                return path.substring(this.openedWorkingDirectory.length + 1);
            } else if (path === this.openedWorkingDirectory) {
                return '';
            }
        }
    }
    return path;
};

Repository.prototype.submoduleForPath = function (path) {
    path = this.relativize(path);
    if (!path) {
        return null;
    }
    let ref = this.submodules;
    for (let submodulePath in ref) {
        if (!ref.hasOwnProperty(submodulePath))
            continue;

        let submoduleRepo = ref[submodulePath];
        if (path === submodulePath) {
            return submoduleRepo;
        } else if (path.indexOf(submodulePath + '/') === 0) {
            let ref1;
            path = path.substring(submodulePath.length + 1);
            return (ref1 = submoduleRepo.submoduleForPath(path)) !== null ? ref1 : submoduleRepo;
        }
    }
    return null;
};

Repository.prototype.isWorkingDirectory = function (path) {
    if (!path) {
        return false;
    }
    if (process.platform === 'win32') {
        path = path.replace(/\\/g, '/');
    } else if (path[0] !== '/') {
        return false;
    }
    if (this.caseInsensitiveFs) {
        let ref;
        let ref1;
        let lowerCasePath = path.toLowerCase();
        if (lowerCasePath === ((ref = this.getWorkingDirectory()) !== null ? ref.toLowerCase() : undefined)) {
            return true;
        }
        if (lowerCasePath === ((ref1 = this.openedWorkingDirectory) !== null ? ref1.toLowerCase() : undefined)) {
            return true;
        }
    } else {
        if (path === this.getWorkingDirectory()) {
            return true;
        }
        if (path === this.openedWorkingDirectory) {
            return true;
        }
    }
    return false;
};

let realpath = function (unrealPath) {
    try {
        return fs.realpathSync(unrealPath);
    } catch (e) {
        return unrealPath;
    }
};

let isRootPath = function (repositoryPath) {
    if (process.platform === 'win32') {
        return /^[a-zA-Z]+:[\\\/]$/.test(repositoryPath);
    }
    return repositoryPath === nodepath.sep;
};

let openRepository = function (repositoryPath) {
    let symlink = realpath(repositoryPath) !== repositoryPath;
    if (process.platform === 'win32') {
        repositoryPath = repositoryPath.replace(/\\/g, '/');
    }
    let repository = new Repository(repositoryPath);
    if (repository.exists()) {
        repository.caseInsensitiveFs = fs.isCaseInsensitive();
        if (symlink) {
            let workingDirectory = repository.getWorkingDirectory();
            while (!isRootPath(repositoryPath)) {
                if (realpath(repositoryPath) === workingDirectory) {
                    repository.openedWorkingDirectory = repositoryPath;
                    break;
                }
                repositoryPath = nodepath.resolve(repositoryPath, '..');
            }
        }
        return repository;
    }
    return null;
};

let openSubmodules = function (repository) {
    repository.submodules = {};
    let ref = repository.getSubmodulePaths();
    let results = [];
    let len = ref.length;
    for (let i = 0; i < len; i++) {
        let relativePath = ref[i];
        if (!relativePath) {
            continue;
        }
        let submodulePath = nodepath.join(repository.getWorkingDirectory(), relativePath);
        let submoduleRepo = openRepository(submodulePath);
        if (submoduleRepo) {
            if (submoduleRepo.getPath() === repository.getPath()) {
                results.push(submoduleRepo.release());
            } else {
                openSubmodules(submoduleRepo);
                results.push(repository.submodules[relativePath] = submoduleRepo);
            }
        } else {
            results.push(undefined);
        }
    }
    return results;
};

exports.open = function (repositoryPath) {
    let repository;
    repository = openRepository(repositoryPath);
    if (repository !== null) {
        openSubmodules(repository);
    }
    return repository;
};
