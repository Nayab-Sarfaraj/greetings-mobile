import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import { loadFont as loadPinyonScript } from "@remotion/google-fonts/PinyonScript";
const display = loadFraunces("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const body = loadFigtree("normal", { weights: ["400"], subsets: ["latin"] });
const script = loadPinyonScript("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
export const fonts = {
  display: display.fontFamily,
  body: body.fontFamily,
  script: script.fontFamily,
};
export const waitForFonts = () =>
  Promise.all([
    display.waitUntilDone(),
    body.waitUntilDone(),
    script.waitUntilDone(),
  ]);
