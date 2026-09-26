// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Deep import ikon Tabler ('@tabler/icons-react-native/IconHome') valid lewat peta `exports`
    // paketnya, tapi resolver eslint-plugin-import tidak membaca peta itu.
    rules: {
      "import/no-unresolved": ["error", { ignore: ["^@tabler/icons-react-native/"] }],
    },
  }
]);
