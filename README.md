# Codex Utilization

A local VS Code extension showing remaining Codex subscription usage and reset times. It uses the documented Codex app-server protocol and displays the quota windows returned for your account; availability and window lengths vary by plan.

## Setup

1. Install the Codex CLI and sign in with your ChatGPT account (`codex login`). An API key reports API usage, not your ChatGPT subscription allowance.
2. Make sure the `codex` executable is on VS Code's PATH. On Windows the extension also looks in VS Code's Codex agent cache. Otherwise, set **Codex Utilization: Executable** to the full path. On Windows, use the executable, not a `.cmd` wrapper.
3. Open this folder in VS Code and press F5 to run an Extension Development Host, or package it with `npx @vscode/vsce package` and install the VSIX.

Click the status bar item to refresh. Hover for quota buckets and reset times. Adjust the refresh interval in settings. The extension starts a local app server for each refresh, uses its existing Codex sign-in, and does not collect or store credentials.

If usage is unavailable, hover over the status item for the error. Confirm the executable path and ChatGPT login. The display reports Codex limits, which may not include all limits in ChatGPT conversations.

See the [Codex app-server documentation](https://learn.chatgpt.com/docs/app-server).
