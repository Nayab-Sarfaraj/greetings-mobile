import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const consumers = [
  "apps/web/package.json",
  "packages/remotion/package.json",
  "apps/web/node_modules/@remotion/player/package.json",
];
for (const dependency of ["react", "remotion"]) {
  const paths = consumers.map((consumer) =>
    createRequire(resolve(consumer)).resolve(dependency),
  );
  assert.equal(
    new Set(paths).size,
    1,
    `${dependency} resolves to multiple instances: ${paths.join(", ")}`,
  );
}
