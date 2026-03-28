const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Forces Xcode to use "iPhone Developer" signing certificate
 * instead of "iOS Distribution" when building with a development certificate.
 */
const withDevelopmentSigning = (config) => {
  return withXcodeProject(config, (config) => {
    try {
      const project = config.modResults;
      const buildSettings = project.pbxXCBuildConfigurationSection();

      Object.keys(buildSettings).forEach((key) => {
        const section = buildSettings[key];
        if (section && section.buildSettings) {
          // Override to use iPhone Developer certificate
          section.buildSettings['CODE_SIGN_IDENTITY'] = '"iPhone Developer"';
          section.buildSettings['CODE_SIGN_IDENTITY_iphoneos'] = '"iPhone Developer"';
          section.buildSettings['CODE_SIGN_STYLE'] = '"Manual"';
          section.buildSettings['DEVELOPMENT_TEAM'] = '"RW4Q5ZGHM2"';
        }
      });
    } catch (e) {
      console.warn('[withDevelopmentSigning] Plugin warning:', e.message);
    }
    return config;
  });
};

module.exports = withDevelopmentSigning;
