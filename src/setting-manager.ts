import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';

export function getSettings() {
    let allWorkspaceFolders = vscode.workspace.workspaceFolders;
    if (allWorkspaceFolders === undefined) {
        vscode.window.showErrorMessage("Please open a workspace and try again.");
        return;
    }
    let workspaceFolder = allWorkspaceFolders[0].uri.path;

    workspaceFolder = sanitizePath(workspaceFolder);

    if (fs.existsSync(`${workspaceFolder}/.vscode`)) {
        vscode.window.showErrorMessage("Workspace already contains .vscode folder.");
        return;
    }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Getting settings.",
        cancellable: true
    }, (progress, token) => {
        const p = new Promise<void>(resolve => {
            const child = exec(workspaceFolder, 'git', ['clone', 'https://git-unisource.md-man.biz:7990/scm/eeeabb/vscode.git', '.vscode']);
            resolve();
        });
        return p;
    });
}

function exec(workingDir: string, command: string, args: string[]) {
    const child = cp.spawn(command, args, {
        "cwd": workingDir
    });

    child.stdout.on('data', (data) => {
        console.debug(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
        console.debug(`stderr: ${data}`);
    });

    child.on('close', (code) => {
        console.debug(`child process exited with code ${code}`);
    });

    child.on('error', (err) => {
        console.debug(`ERROR: ${err}`);
    });
}

function sanitizePath(path: string): string {
    return path.replace(/^\/([a-z]):\//i, (_, letter) => `${letter.toUpperCase()}:\\`);
}