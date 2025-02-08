const vscode = require("vscode");
const liveServer = require("live-server");
const net = require("net");

let statusBarItem;
let currentPort = 5500;

async function getAvailablePort(startPort) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once("error", () => resolve(getAvailablePort(startPort + 1))); // Try next port if in use
        server.once("listening", () => {
            server.close(() => resolve(startPort)); // Port is available
        });
        server.listen(startPort);
    });
}

async function startServer() {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!folder) {
        vscode.window.showErrorMessage("Open a folder to start the server.");
        return;
    }

    currentPort = await getAvailablePort(5500);

    statusBarItem.text = `$(sync~spin) Loading...`;

    // Check if index.html or index.htm exists
    const fs = require("fs");
    let defaultFile = "index.html";
    if (!fs.existsSync(`${folder}/index.html`) && fs.existsSync(`${folder}/index.htm`)) {
        defaultFile = "index.htm";
    }

    const params = {
        port: currentPort,
        root: folder,
        open: true,
        logLevel: 2,
        wait: 100,
        cors: true,
        file: defaultFile
    };

    liveServer.start(params);

    setTimeout(() => {
        vscode.window.showInformationMessage(`Server started at http://localhost:${currentPort}`);
        statusBarItem.text = `$(radio-tower) Stop Server`;
        statusBarItem.command = "yourserver.stop";
    }, 300);
}

function stopServer() {
    liveServer.shutdown();
    vscode.window.showInformationMessage("Server stopped.");

    statusBarItem.text = `$(play) Start Server`;
    statusBarItem.command = "yourserver.start";
}

function activate(context) {
    let startCommand = vscode.commands.registerCommand("yourserver.start", startServer);
    let stopCommand = vscode.commands.registerCommand("yourserver.stop", stopServer);

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = `$(play) Start Server`;
    statusBarItem.command = "yourserver.start";
    statusBarItem.show();

    context.subscriptions.push(statusBarItem, startCommand, stopCommand);
}

function deactivate() {
    if (liveServer) {
        liveServer.shutdown();
    }
}

module.exports = {
    activate,
    deactivate
};
