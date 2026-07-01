// Generate tintable drip masks by cropping single RUNS out of drips.png.
// drips.png already carries a clean alpha channel (white drips / transparent bg),
// so we lift the alpha, recolor it white, crop + trim → masks usable as CSS
// `mask` + `background-color` (each drip tints to match its source). We crop the
// RUNS only (no wide splat top) so a drip reads as thin paint flowing straight
// out of a letter — its top tucks behind the text with nothing sticking out.
//   run: node scripts/make-drip-masks.mjs
import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(dir, "../public/drips/drips.png");
const OUT = path.join(dir, "../public/drips");

async function makeMask(box, file) {
  const alpha = await sharp(SRC).extract(box).extractChannel(3).toColourspace("b-w").raw().toBuffer();
  const white = await sharp({ create: { width: box.width, height: box.height, channels: 3, background: "#ffffff" } })
    .raw()
    .toBuffer();
  const info = await sharp(white, { raw: { width: box.width, height: box.height, channels: 3 } })
    .joinChannel(alpha, { raw: { width: box.width, height: box.height, channels: 1 } })
    .trim({ threshold: 5 })
    .png()
    .toFile(path.join(OUT, file));
  console.log("mask", file, `${info.width}x${info.height}`);
}

// run-only crops from the 1024x1024 source (below the splats)
const MASKS = {
  "drip-1.png": { left: 688, top: 372, width: 46, height: 210 }, // clean thin run + bulb (short)
  "drip-2.png": { left: 688, top: 355, width: 46, height: 360 }, // clean thin run + bulb (medium)
  "drip-3.png": { left: 832, top: 372, width: 48, height: 372 }, // run + a small side dribble (long)
};
for (const [file, box] of Object.entries(MASKS)) await makeMask(box, file);
console.log("done");
