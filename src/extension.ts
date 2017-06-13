'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// var spawn = require('cross-spawn');
const { spawn } = require('child_process');

// this method is called when your extension is activated   
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let recommendations = vscode.workspace.getConfiguration('extensions').recommendations;
    let installed: Array<string> = vscode.extensions.all.map(ext => ext.id);

    let install = recommendations.filter(ext => !installed.includes(ext));
    Promise.all(install.map(ext => {
        return new Promise((res, rej) => {
            const cmd = spawn('code', ['--install-extension', ext]);
            cmd.stdout.on('data', (data) => console.log(data));
            cmd.stderr.on('data', (data) => console.log(data));
            cmd.on('close', (code) => {
                res(code);
            });
        });
    })).then(() => {
        console.log("Installed new extensions");
    })

    // const cmd = spawn('code', ['--install-extension', '']);

    // cmd.stdout.on('data', (data) => {
    //     console.log(`stdout: ${data}`);
    // });

    // cmd.stderr.on('data', (data) => {
    //     console.log(`stderr: ${data}`);
    // });

    // cmd.on('close', (code) => {
    //     console.log(`child process exited with code ${code}`);
    // });

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        console.log('ddddd');
        vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}