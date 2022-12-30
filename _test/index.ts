import { getJSONFromRXUIFile } from "../src";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

(async () => {
  const contentJson = await readFileSync(resolve(__dirname, "content.json"));
  const resultContent = getJSONFromRXUIFile(JSON.parse(contentJson.toString()).content);
  writeFileSync(
    resolve(__dirname, "result.json"),
    JSON.stringify(resultContent)
  );
})();
