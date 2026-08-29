import { getQuranEncChapter, QURANENC_RESOURCES } from "../src/providers/quranenc/quranenc.provider.js";
import { listTanzilChapters } from "../src/providers/tanzil/tanzil.provider.js";

const chapters = listTanzilChapters();
for (const resource of QURANENC_RESOURCES) {
  let verses = 0;
  for (const chapter of chapters) {
    const records = await getQuranEncChapter(resource, chapter.id);
    if (records.length !== chapter.versesCount) throw new Error(resource.key + " " + chapter.id + ": count mismatch");
    records.forEach((record, index) => {
      if (record.chapterId !== chapter.id || record.verseNumber !== index + 1 || typeof record.text !== "string" || !record.text.length || typeof record.footnotes !== "string") throw new Error(resource.key + " " + chapter.id + ":" + (index + 1) + ": integrity failure");
    });
    verses += records.length;
  }
  console.log(resource.key + " | " + resource.classification + " | 114 chapters | " + verses + " verses | PASS");
}
