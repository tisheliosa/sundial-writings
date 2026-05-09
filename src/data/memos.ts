import type { Memo } from "../types";

// Each .txt file in this folder is the body of a memo. Vite's `?raw` import
// suffix inlines the file contents as a string at build time, so the bodies
// are part of the bundle and there's no runtime fetch.
import softIntimateSecure from "./soft-intimate-secure.txt?raw";
import flameFlickers from "./flame-flickers.txt?raw";
import gearingExcitement from "./gearing-excitement.txt?raw";
import sentences2025 from "./2025-in-sentences.txt?raw";
import inHerHomeCountry from "./in-her-home-country.txt?raw";
import whyteOnFriendshipAndHeartbreak from "./whyte-on-friendship-and-heartbreak.txt?raw";
import distanceMakesHeartsVeryFondIndeed from "./distance-makes-hearts-very-fond-indeed.txt?raw";
import toSayGoodbyeFirst from "./to-say-goodbye-first.txt?raw";

/** Convert a .txt filename like "soft-intimate-secure.txt" into a title
 *  like "soft intimate secure" (drop the extension, replace dashes with
 *  spaces). Kept as a helper so the title source-of-truth stays the
 *  filename — no hand-typed titles to drift out of sync. */
function titleFromFilename(filename: string): string {
  return filename.replace(/\.txt$/, "").replace(/-/g, " ");
}

interface RawMemo {
  filename: string;
  body: string;
  createdAt: string;
}

// Order is significant — it's the order memos appear in the carousel.
const RAW_MEMOS: RawMemo[] = [
  { filename: "soft-intimate-secure.txt", body: softIntimateSecure, createdAt: "2025-08-02" },
  { filename: "flame-flickers.txt", body: flameFlickers, createdAt: "2025-08-14" },
  { filename: "gearing-excitement.txt", body: gearingExcitement, createdAt: "2025-11-21" },
  { filename: "2025-in-sentences.txt", body: sentences2025, createdAt: "2026-01-05" },
  { filename: "in-her-home-country.txt", body: inHerHomeCountry, createdAt: "2026-02-10" },
  { filename: "whyte-on-friendship-and-heartbreak.txt", body: whyteOnFriendshipAndHeartbreak, createdAt: "2026-03-08" },
  { filename: "distance-makes-hearts-very-fond-indeed.txt", body: distanceMakesHeartsVeryFondIndeed, createdAt: "2026-03-15" },
  { filename: "to-say-goodbye-first.txt", body: toSayGoodbyeFirst, createdAt: "2026-05-01" },
];

export const seedMemos: Memo[] = RAW_MEMOS.map((m, index) => ({
  id: index + 1,
  title: titleFromFilename(m.filename),
  body: m.body,
  createdAt: m.createdAt,
}));
