import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const alias = {
  '@': path.resolve(__dirname, './src'),
  '@assets': path.resolve(__dirname, './src/assets'),
  '@components': path.resolve(__dirname, './src/components'),
  '@pages': path.resolve(__dirname, './src/pages'),
  '@context': path.resolve(__dirname, './src/context'),
  '@core': path.resolve(__dirname, './src/core'),
  '@utilities': path.resolve(__dirname, './src/utilities'),
  '@hooks': path.resolve(__dirname, './src/hooks'),
};

export default alias;
