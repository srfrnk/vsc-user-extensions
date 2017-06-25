'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// var spawn = require('cross-spawn');
const { spawn } = require('child_process');
const output: vscode.OutputChannel = vscode.window.createOutputChannel('User-Extensions');

// this method is called when your extension is activated   
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let recommendations = vscode.workspace.getConfiguration('extensions').recommendations;
    getExtensions().then(installed => {
        installAll(recommendations, installed);
        uninstallAll(recommendations, installed);
    }).then(() => {
        output.append('Done');
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function getExtensions(): Promise<Array<string>> {
    return new Promise((res, rej) => {
        let extensions = "";
        const cmd = spawn('code', ['--list-extensions']);
        cmd.stdout.on('data', (data) => extensions += data.toString());
        cmd.stderr.on('data', (data) => console.log(data.toString()));
        cmd.on('close', (code) => {
            res(extensions.split('\n').filter(e => e.length > 0));
        });
    });
}

function installAll(recommendations: Array<string>, installed: Array<string>) {
    let install = recommendations.filter(ext => !installed.includes(ext));
    if (install.length > 0) {
        Promise.all(install.map(ext => {
            return new Promise((res, rej) => {
                const cmd = spawn('code', ['--install-extension', ext]);
                cmd.stdout.on('data', (data) => console.log(data.toString()));
                cmd.stderr.on('data', (data) => console.log(data.toString()));
                cmd.on('close', (code) => {
                    res(code);
                });
            });
        })).then(() => {
            output.append('Installed new extensions - Please reload window');
        });
    }
}

function uninstallAll(recommendations: Array<string>, installed: Array<string>) {
    let uninstall = installed.filter(ext => !recommendations.includes(ext));
    if (uninstall.length > 0) {
        Promise.all(uninstall.map(ext => {
            return new Promise((res, rej) => {
                output.append(`Uninstalling ${ext}`);
                const cmd = spawn('code', ['--uninstall-extension', ext]);
                cmd.stdout.on('data', (data) => console.log(data.toString()));
                cmd.stderr.on('data', (data) => console.log(data.toString()));
                cmd.on('close', (code) => {
                    res(code);
                });
            });
        })).then(() => {
            output.append('Uninstalled old extensions - Please reload window');
        });
    }
}