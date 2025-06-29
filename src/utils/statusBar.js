"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusBar = updateStatusBar;
function updateStatusBar(statusBarItem, xp, level) {
    console.log('Updating status bar:', { xp, level }); // Debugging log
    if (statusBarItem) {
        statusBarItem.text = `$(star) Level: ${level} | XP: ${xp}/${level * 100}`;
        statusBarItem.show();
    }
}
//# sourceMappingURL=statusBar.js.map