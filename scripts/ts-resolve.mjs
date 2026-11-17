// Hook dla `node --test`: Node 24 sam usuwa typy z plików .ts, ale nie dopisuje
// rozszerzeń. Kod aplikacji importuje względnie bez rozszerzenia (jak w bundlerze),
// więc tu dopisujemy ".ts" do takich importów.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    if (relative && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        // nie .ts: zwykłe rozwiązywanie niżej
      }
    }
    return nextResolve(specifier, context);
  },
});
