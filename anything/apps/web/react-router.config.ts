import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: './src/app',
	ssr: true,
	prerender: ['/*?'],
	future: {
		v8_middleware: true,
		v8_splitRouteModules: true,
		v8_viteEnvironmentApi: false,
		v8_passThroughRequests: true,
		v8_trailingSlashAwareDataRequests: true,
	},
} satisfies Config;
