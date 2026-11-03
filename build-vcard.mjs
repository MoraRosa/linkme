// Regenerates contact.vcf from card.json.  Run:  node build-vcard.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { extname } from "node:path";

const c = JSON.parse(readFileSync(new URL("./card.json", import.meta.url), "utf8"));
const esc = (s = "") =>
  String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

// vCard lines should be folded at 75 characters; continuation lines start with a space.
const fold = (line) => {
  const out = [];
  while (line.length > 75) { out.push(line.slice(0, 75)); line = " " + line.slice(75); }
  out.push(line);
  return out.join("\r\n");
};

const L = ["BEGIN:VCARD", "VERSION:3.0"];
L.push(`N:${esc(c.lastName)};${esc(c.firstName)};;;`);
L.push(`FN:${esc(c.name)}`);
if (c.org) L.push(`ORG:${esc(c.org)}`);
if (c.title) L.push(`TITLE:${esc(c.title)}`);
if (c.phone) L.push(`TEL;TYPE=CELL,VOICE:${esc(c.phone)}`);
if (c.email) L.push(`EMAIL;TYPE=INTERNET,WORK:${esc(c.email)}`);
if (c.city) L.push(`ADR;TYPE=WORK:;;;${esc(c.city)};${esc(c.region)};;${esc(c.country)}`);
if (c.tagline) L.push(`NOTE:${esc(c.tagline)}`);

// Optional photo: a local file path in card.json ("photo": "me.jpg"). Keep it small (about 400px square).
if (c.photo && !/^https?:/i.test(c.photo)) {
  const file = new URL("./" + c.photo, import.meta.url);
  if (existsSync(file)) {
    const type = { ".png": "PNG", ".gif": "GIF" }[extname(c.photo).toLowerCase()] || "JPEG";
    L.push(`PHOTO;ENCODING=b;TYPE=${type}:${readFileSync(file).toString("base64")}`);
  } else {
    console.warn(`photo "${c.photo}" not found, skipping it in the vCard`);
  }
}

// Labeled URLs: the "itemN." grouping makes iOS and macOS Contacts show the label.
let n = 0;
for (const link of c.links || []) {
  if (!link.url) continue;
  n += 1;
  L.push(`item${n}.URL:${link.url}`);
  L.push(`item${n}.X-ABLabel:${esc(link.label)}`);
}
L.push("END:VCARD");

writeFileSync(new URL("./contact.vcf", import.meta.url), L.map(fold).join("\r\n") + "\r\n");
console.log(`contact.vcf written (${n} links)`);
