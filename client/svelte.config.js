import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),

		typescript: {
			config: (tsconfig) => {
				const {
					importsNotUsedAsValues: _,
					preserveValueImports: __,
					...compilerOptions
				} = tsconfig.compilerOptions;

				return {
					...tsconfig,
					compilerOptions: {
						...compilerOptions,
						ignoreDeprecations: '5.0'
					}
				};
			}
		},

		alias: {
			$c: 'src/components',
			$s: 'src/store',
			$api: 'src/api/axios.js'
		}
	}
};

export default config;
