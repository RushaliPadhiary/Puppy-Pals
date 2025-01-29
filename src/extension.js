const vscode = require("vscode");
const path = require("path");

// Puppy Explorer Panel
class PuppyProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    return [
      new vscode.TreeItem("🐶 Puppy 1", vscode.TreeItemCollapsibleState.None),
      new vscode.TreeItem("🐶 Puppy 2", vscode.TreeItemCollapsibleState.None),
      new vscode.TreeItem("🐶 Puppy 3", vscode.TreeItemCollapsibleState.None),
    ];
  }
}

function activate(context) {
  // Register Puppy Panel in Explorer
  const provider = new PuppyProvider();
  vscode.window.registerTreeDataProvider("puppyPanel", provider);

  // Command: Open Puppy Pals Webview
  context.subscriptions.push(
    vscode.commands.registerCommand("puppy-pals.start", () => {
      const panel = vscode.window.createWebviewPanel(
        "puppyPals",
        "Puppy Pals",
        vscode.ViewColumn.Two,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent(context, panel.webview);
    })
  );

  // Click a puppy in the Explorer to open Webview
  context.subscriptions.push(
    vscode.commands.registerCommand("puppyPals.open", () => {
      vscode.commands.executeCommand("puppy-pals.start");
    })
  );

  console.log("🐶 Puppy Pals Extension Activated!");
}

function getWebviewContent(context, webview) {
  const styleUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, "media/puppy-styles.css"))
  );

  const assetsUri = (fileName) =>
    webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, "src/assets", fileName))
    );

  const puppies = [
    { name: "Buddy", sprite: "puppy1.gif" },
    { name: "Bella", sprite: "puppy2.gif" },
    { name: "Max", sprite: "puppy3.gif" },
  ];

  const puppyContainers = puppies
    .map((puppy) => {
      return `
        <div class="puppy-container">
          <img src="${assetsUri(puppy.sprite)}" class="puppy" data-name="${puppy.name}" />
          <input type="text" class="rename-input" placeholder="Rename me!" />
          <p class="puppy-name">${puppy.name}</p>
          <div class="happiness-bar-container">
            <div class="happiness-bar"></div>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src ${webview.cspSource};">
      <link rel="stylesheet" href="${styleUri}">
    </head>
    <body>
      <button id="throw-ball">Throw Ball!</button>
      <div id="ball"></div>
      <div id="puppy-playground">${puppyContainers}</div>
      <script>
        const puppies = document.querySelectorAll('.puppy');
        const inputs = document.querySelectorAll('.rename-input');
        const ball = document.getElementById('ball');
        const playground = document.getElementById('puppy-playground');
        const throwButton = document.getElementById('throw-ball');
        const happinessLevels = Array.from(puppies).map(() => 100);
        const happinessBars = document.querySelectorAll('.happiness-bar');
        const sounds = {
          bark: new Audio('https://www.soundjay.com/button/beep-07.wav')
        };

        inputs.forEach((input, index) => {
          input.addEventListener('change', (event) => {
            const newName = event.target.value.trim();
            if (newName) {
              document.querySelectorAll('.puppy-name')[index].textContent = newName;
              puppies[index].dataset.name = newName;
            }
          });
        });

        throwButton.addEventListener('click', () => {
          ball.style.left = Math.random() * (playground.offsetWidth - 50) + 'px';
          ball.style.top = Math.random() * (playground.offsetHeight - 50) + 'px';

          puppies.forEach((puppy) => {
            setTimeout(() => {
              puppy.style.left = ball.style.left;
              puppy.style.top = ball.style.top;
            }, 1000);
          });
        });

        setInterval(() => {
          puppies.forEach((puppy, index) => {
            happinessLevels[index] = Math.max(happinessLevels[index] - 5, 0);
            happinessBars[index].style.width = happinessLevels[index] + '%';
            if (happinessLevels[index] === 0) puppy.classList.add('sad');
          });
        }, 5000);

        puppies.forEach((puppy, index) => {
          puppy.addEventListener('click', () => {
            happinessLevels[index] = 100;
            happinessBars[index].style.width = '100%';
            puppy.classList.remove('sad');
            sounds.bark.play();
            alert(puppy.dataset.name + " says Woof Woof!");
          });
        });

        const month = new Date().getMonth();
        if (month === 11) {
          puppies.forEach((puppy) => {
            const hat = document.createElement('img');
            hat.src = '${assetsUri("holiday-hat.png")}';
            hat.classList.add('holiday-hat');
            puppy.parentElement.appendChild(hat);
          });
        }

        setInterval(() => {
          puppies.forEach(puppy => {
            const rect = puppy.getBoundingClientRect();
            puppies.forEach(otherPuppy => {
              if (puppy !== otherPuppy) {
                const otherRect = otherPuppy.getBoundingClientRect();
                const dx = rect.left - otherRect.left;
                const dy = rect.top - otherRect.top;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                  otherPuppy.classList.add('sniff');
                  setTimeout(() => otherPuppy.classList.remove('sniff'), 500);
                }
              }
            });
          });
        }, 1000);
      </script>
    </body>
    </html>
  `;
}

function deactivate() {}

module.exports = { activate, deactivate };