const { withXcodeProject } = require('@expo/config-plugins');

// Newer Xcode sandboxes user build scripts by default (ENABLE_USER_SCRIPT_SANDBOXING=YES),
// which blocks React Native's bundle scripts from writing files like ip.txt into the .app.
// Force it off across all build configs so `expo run:ios` and Xcode builds succeed.
module.exports = function withDisableScriptSandbox(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configurations)) {
      const entry = configurations[key];
      if (entry && typeof entry === 'object' && entry.buildSettings) {
        entry.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
      }
    }
    return cfg;
  });
};
