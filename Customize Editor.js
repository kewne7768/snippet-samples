// https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneEditorConstructionOptions.html
// Don't set "value" or things will break.
settingsRaw.snippetsMonacoExtraSettings = {
    fontSize: 12,
};
// This is just an easy place to put the settings, no need to keep running.
return stopRunning();
