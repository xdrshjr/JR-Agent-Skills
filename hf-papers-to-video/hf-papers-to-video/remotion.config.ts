import { Config } from '@remotion/cli/config';

export const config: Config = {
  // Override the default webpack configuration
  webpackOverride: (webpackConfig) => {
    return {
      ...webpackConfig,
      module: {
        ...webpackConfig.module,
        rules: [
          ...(webpackConfig.module?.rules || []),
          {
            test: /\.json$/,
            type: 'json',
          },
        ],
      },
    };
  },
  // Set a custom port for the Remotion Dev Server
  setPort: 3003,
  // Set a custom number of parallel renders
  setConcurrency: 4,
};

export default config;
