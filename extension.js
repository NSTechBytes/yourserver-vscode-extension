const vscode = require("vscode");
const liveServer = require("live-server");
const { exec } = require("child_process");

let statusBarItem;
let currentPort = 5500;

async function getAvailablePort(startPort) {
    return new Promise((resolve) => {
        const tempServer = require("net").createServer();
        tempServer.listen(startPort, () => {
            const port = tempServer.address().port;
            tempServer.close(() => resolve(port));
        });
        tempServer.on("error", () => resolve(getAvailablePort(startPort + 1))); 
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

    const params = {
        port: currentPort,
        root: folder,
        open: true,
        logLevel: 2,
        wait: 100,
        cors: true,
        file: "index.html"
    };

    liveServer.start(params);

    setTimeout(() => {
        vscode.window.showInformationMessage(`Server started at http://localhost:${currentPort}`);
        statusBarItem.text = `$(radio-tower) Stop Server`;
        statusBarItem.command = "yourserver.stop";
    }, 3000); // Simulating page load time
}

function stopServer() {
    liveServer.shutdown();
    vscode.window.showInformationMessage("Server stopped.");
    
    exec(`npx kill-port ${currentPort}`, () => {});

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
    stopServer();
}

module.exports = {
    activate,
    deactivate
};
