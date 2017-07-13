'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const { spawn } = require('child_process');
const output: vscode.OutputChannel = vscode.window.createOutputChannel('User-Extensions');
var chokidar = require('chokidar');

import * as fs from 'fs';
import * as path from 'path';

let watcher;

// this method is called when your extension is activated   
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    if (vscode.workspace.getConfiguration('extensions').recommendations.length === 0) {
        saveInstalled()
            .then(() => {
                updateInstalled()
            })
            .then(() => { listenForChanges() });
    }
    else {
        updateInstalled()
            .then(() => { listenForChanges() });
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
    watcher.close();
}

function updateInstalled() {
    let recommendations = vscode.workspace.getConfiguration('extensions').recommendations;
    return getExtensions().then(installed => {
        return Promise.all([
            installAll(recommendations, installed),
            uninstallAll(recommendations, installed)
        ]);
    }).then((changes) => {
        if (changes.some(change => change)) {
            vscode.window.showInformationMessage('Installed/Uninstalled extensions! Please reload window :)', 'Reload').then(
                res => {
                    if (res === 'Reload')
                    { vscode.commands.executeCommand('workbench.action.reloadWindow'); }
                });
        }
    });
}

function listenForChanges() {
    let extDir = `${process.env.HOME}/.vscode/extensions`;
    watcher = chokidar.watch(extDir, { depth: 0, ignored: /\.obsolete/ });
    watcher.on('ready', () => {
        output.appendLine('Ready...');
        watcher.on('all', (event, path1) => {
            saveInstalled();
        });
    });
}

function saveInstalled(): Promise<void> {
    output.appendLine('Updating settings...');
    return getExtensions().then(installed => {
        let extensions = vscode.workspace.getConfiguration('extensions');
        return extensions.update('recommendations', installed, true);
    }).then(() => {
        output.appendLine('Ready...');
    }).catch(err => console.log(err));
}

function getExtensions(): Promise<Array<string>> {
    return new Promise((res, rej) => {
        let extensions = "";
        const cmd = spawn('code', ['--list-extensions']);
        cmd.stdout.on('data', (data) => extensions += data.toString());
        cmd.stderr.on('data', (data) => output.appendLine(data.toString()));
        cmd.on('close', (code) => {
            res(extensions.split('\n').filter(e => e.length > 0));
        });
    });
}

function installAll(recommendations: Array<string>, installed: Array<string>): Promise<boolean> {
    let install = recommendations.filter(ext => !installed.includes(ext));
    if (install.length > 0) {
        return Promise.all(install.map(ext => {
            return new Promise((res, rej) => {
                const cmd = spawn('code', ['--install-extension', ext]);
                cmd.stdout.on('data', (data) => output.appendLine(data.toString()));
                cmd.stderr.on('data', (data) => output.appendLine(data.toString()));
                cmd.on('close', (code) => {
                    res(code);
                });
            });
        })).then(() => {
            output.appendLine('Installed new extensions - Please reload window');
            return true;
        });
    }
    else {
        return Promise.resolve(false);
    }
}

function uninstallAll(recommendations: Array<string>, installed: Array<string>): Promise<boolean> {
    let uninstall = installed.filter(ext => !recommendations.includes(ext));
    if (uninstall.length > 0) {
        return Promise.all(uninstall.map(ext => {
            return new Promise((res, rej) => {
                output.appendLine(`Uninstalling ${ext}`);
                const cmd = spawn('code', ['--uninstall-extension', ext]);
                cmd.stdout.on('data', (data) => output.appendLine(data.toString()));
                cmd.stderr.on('data', (data) => output.appendLine(data.toString()));
                cmd.on('close', (code) => {
                    res(code);
                });
            });
        })).then(() => {
            output.appendLine('Uninstalled old extensions - Please reload window');
            return true;
        });
    }
    else {
        return Promise.resolve(false);
    }
}
