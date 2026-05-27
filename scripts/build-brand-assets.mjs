import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import QRCode from "qrcode";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const assets = join(root, "assets");
const card = JSON.parse(readFileSync(join(root, "data", "card.json"), "utf8"));

const BRAND_MARK = readFileSync(join(assets, "brand-mark.svg"));
const FAVICON_SVG = readFileSync(join(assets, "favicon.svg"));
const QR_MARK = readFileSync(join(assets, "brand-mark-qr.svg"));

function renderSvg(svgBuffer, width) {
    const resvg = new Resvg(svgBuffer, {
        fitTo: { mode: "width", value: width },
        font: { loadSystemFonts: false }
    });
    return resvg.render().asPng();
}

async function writePngFromSvg(svgBuffer, width, outputPath) {
    const png = renderSvg(svgBuffer, width);
    await sharp(png).png({ compressionLevel: 9, palette: width <= 32 }).toFile(outputPath);
    console.log(`  ✓ ${outputPath.replace(root + "\\", "").replace(root + "/", "")} (${width}px)`);
}

async function buildIconSet() {
    console.log("Exporting favicon PNG set…");
    await writePngFromSvg(FAVICON_SVG, 16, join(assets, "favicon-16x16.png"));
    await writePngFromSvg(FAVICON_SVG, 32, join(assets, "favicon-32x32.png"));
    await writePngFromSvg(BRAND_MARK, 180, join(assets, "apple-touch-icon.png"));
    await writePngFromSvg(BRAND_MARK, 192, join(assets, "favicon-192x192.png"));
    await writePngFromSvg(BRAND_MARK, 512, join(assets, "favicon-512x512.png"));

    const icoInput = [
        join(assets, "favicon-16x16.png"),
        join(assets, "favicon-32x32.png")
    ];
    const { default: pngToIco } = await import("png-to-ico");
    writeFileSync(join(assets, "favicon.ico"), await pngToIco(icoInput));
    console.log("  ✓ assets/favicon.ico (16 + 32px)");
}

async function buildBrandedQr() {
    const qrUrl = card.shareFallbackUrl?.trim() || card.contact?.website || "https://example.com";
    const size = 1024;
    const logoRatio = 0.24;

    console.log(`Generating branded QR for: ${qrUrl}`);

    const qrBuffer = await QRCode.toBuffer(qrUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: size,
        color: {
            dark: "#0f3d66",
            light: "#ffffff"
        }
    });

    const logoSize = Math.round(size * logoRatio);
    const logoPng = renderSvg(QR_MARK, logoSize);

    const outputPath = join(assets, "MYQR.png");
    await sharp(qrBuffer)
        .composite([{ input: logoPng, gravity: "center" }])
        .png({ compressionLevel: 9 })
        .toFile(outputPath);

    console.log(`  ✓ assets/MYQR.png (${size}px, center logo ${logoSize}px)`);
}

console.log("Building brand assets…\n");
await buildIconSet();
await buildBrandedQr();
console.log("\nDone.");
