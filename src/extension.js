'use strict';
const vscode = require('vscode');
const { readLimits } = require('./client');
const { windows, duration, summary, severity } = require('./usage');

function setBarColor(bar, state) {
  const colors = {
    normal: 'testing.iconPassed',
    warning: 'problemsWarningIcon.foreground',
    critical: 'problemsErrorIcon.foreground'
  };
  bar.color = new vscode.ThemeColor(colors[state]);
  bar.backgroundColor = undefined;
}

function activate(context) {
  const bar = vscode.window.createStatusBarItem('codexUtilization.status', vscode.StatusBarAlignment.Right, 100);
  bar.name = 'Codex Utilization';
  bar.command = 'codexUtilization.refresh';
  bar.text = '$(sync~spin) Codex';
  bar.show();
  let pending = false;
  let timer;
  let disposed = false;
  async function refresh() {
    if (pending || disposed) return;
    pending = true;
    clearTimeout(timer);
    try {
      const config = vscode.workspace.getConfiguration('codexUtilization');
      const result = await readLimits(config.get('executable', 'codex'));
      if (disposed) return;
      const items = windows(result || {});
      if (!items.length) throw new Error('No usage windows returned. Check that Codex is signed in with ChatGPT.');
      bar.text = `$(pulse) Codex ${summary(items)}`;
      bar.tooltip = new vscode.MarkdownString(['**Codex usage remaining**', ...items.map(x => `- ${x.name} · ${duration(x.minutes)}: ${Math.max(0, Math.min(100, 100 - x.used)).toFixed(0)}% remaining${x.reset ? ` · resets ${new Date(x.reset * 1000).toLocaleString()}` : ''}`), '', 'Click to refresh.'].join('\n'));
      setBarColor(bar, severity(items));
    } catch (error) {
      if (disposed) return;
      bar.text = '$(warning) Codex usage unavailable';
      bar.tooltip = `${error.message}\nCheck the Codex executable setting and ChatGPT login. Click to retry.`;
      bar.color = undefined;
      bar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } finally {
      pending = false;
      if (!disposed) {
        const seconds = vscode.workspace.getConfiguration('codexUtilization').get('refreshSeconds', 120);
        timer = setTimeout(refresh, Math.max(30, Math.min(3600, Number(seconds) || 120)) * 1000);
      }
    }
  }
  context.subscriptions.push(bar, vscode.commands.registerCommand('codexUtilization.refresh', refresh), vscode.workspace.onDidChangeConfiguration(event => { if (event.affectsConfiguration('codexUtilization')) refresh(); }), { dispose() { disposed = true; clearTimeout(timer); } });
  refresh();
}
module.exports = { activate };
