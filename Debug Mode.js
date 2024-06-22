// @ts-nocheck
// Exports stuff to the window object so you can peek into script data via your browser console.
// Useful when developing.
let exportedToWindow = {
    buildings,
    jobs,
    state,
    settings,
    settingsRaw,
    resources,
    crafter,
    projects,
    SnippetManager,
    SnippetEditorManager,
    TriggerManager,
    fastEval,
    get snippetData() { return snippetData; }, // Object changes every tick
};

if (typeof unsafeWindow !== 'undefined') {
    unsafeWindow.autoEvolve = exportedToWindow;
}
else {
    window.autoEvolve = exportedToWindow;
}

stopRunning();
