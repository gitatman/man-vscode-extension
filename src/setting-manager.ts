import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';

export async function getSettings() {
    let workspaceFolder = getWorkspaceFolder();
    if (workspaceFolder === "") {
        vscode.window.showErrorMessage("Please open a workspace and try again.");
        return;
    }

    // Verify that .vscode folder does not exist
    if (fs.existsSync(`${workspaceFolder}/.vscode`)) {
        vscode.window.showErrorMessage("Workspace already contains .vscode folder.");
        return;
    }

    // Clone the vscode repository to .vscode folder
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Getting settings.",
        cancellable: true
    }, (progress, token) => {
        const p = new Promise<void>(resolve => {
            const child = exec(workspaceFolder, 'git', ['clone', 'https://git-unisource.md-man.biz:7990/scm/eeeabb/vscode.git', '.vscode', '-q']);
            resolve();
        });
        return p;
    });
}

export async function updateSettings() {
    let workspaceFolder = getWorkspaceFolder();
    if (workspaceFolder === "") {
        vscode.window.showErrorMessage("Please open a workspace and try again.");
        return;
    }

    let vscodeFolder = `${workspaceFolder}/.vscode`;
    // Verify that .vscode folder exists
    if (!fs.existsSync(vscodeFolder)) {
        vscode.window.showErrorMessage("Workspace does not contain .vscode folder. Run command 'MAN: Get Settings' to download folder.");
        return;
    }

    let vscodeGitFolder = `${vscodeFolder}/.git`;
    // Verify that .vscode folder is our vscode git repository
    if (!fs.existsSync(vscodeGitFolder)) {
        vscode.window.showErrorMessage(".vscode folder is not a git repository. Delete/backup the folder and run command 'MAN: Get Settings' to download folder.");
        return;
    }

    // Verify that the vscode repository has the expected remote URL
    let remoteUrl = await execWithStdout(vscodeGitFolder, 'git', ['config', '--get', 'remote.origin.url'])
    .then(function(result) {
        return result.trim();
    }, function(error) {
        throw Error(error);
    });
    let urlRegex = /^https:\/\/.*git-unisource\.md-man\.biz:7990\/scm\/eeeabb\/vscode\.git$/;
    if (!remoteUrl.match(urlRegex)) {
        vscode.window.showErrorMessage(".vscode git repository does not have expected remote URL. Delete/backup the folder and run command 'MAN: Get Settings' to download folder.");
        return;
    }

    // Pull any recent changes
    execWithStdout(vscodeFolder, 'git', ['pull'])
    .then(function(result) {
        if (result.trim() === "Already up to date.") {
            vscode.window.showInformationMessage(result);
        } else {
            vscode.window.showInformationMessage("Settings succesfully updated.");
        }
    }, function(error) {
        vscode.window.showErrorMessage(error);
    });
}

function getWorkspaceFolder() {
    let allWorkspaceFolders = vscode.workspace.workspaceFolders;
    if (allWorkspaceFolders === undefined) {
        return "";
    }
    let workspaceFolder = allWorkspaceFolders[0].uri.path;

    return sanitizePath(workspaceFolder);
}

function execWithStdout(workingDir: string, command: string, args: string[]) {
    return new Promise<string>((resolve, reject) => {
        const child = execCB(workingDir, command, args, function(output, code) {
            if (code === 0) {
                resolve(output);
            } else {
                reject(`'${command} ${args.join(' ')}' returned non-zero exit code ${code}`);
            }
        });
    });
}

// Execute without callback function
function exec(workingDir: string, command: string, args: string[]) {
    _exec(workingDir, command, args, function(output, code) {});
}

// Execute with callback function
function execCB(workingDir: string, command: string, args: string[], callback: (buffer: string, code: number) => void) {
    _exec(workingDir, command, args, callback);
}

function _exec(workingDir: string, command: string, args: string[], callback: (buffer: string, code: number) => void) {
    const child = cp.spawn(command, args, {
        "cwd": workingDir
    });

    let buffer = "";

    child.stdout.on('data', (data) => {
        console.debug(`stdout: ${data}`);
        buffer += data;
    });

    child.stderr.on('data', (data) => {
        console.debug(`stderr: ${data}`);
        vscode.window.showErrorMessage(`ERROR: ${data}`);
    });

    child.on('error', (err) => {
        console.debug(`error: ${err}`);
        vscode.window.showErrorMessage(`ERROR: ${err}`);
    });

    child.on('close', (code) => {
        console.debug(`child process exited with code ${code}`);
        callback(buffer, code);
    });
}

function sanitizePath(path: string): string {
    return path.replace(/^\/([a-z]):\//i, (_, letter) => `${letter.toUpperCase()}:\\`);
}