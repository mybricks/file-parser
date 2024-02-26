import {toJSONFromPageDump, toJSONFromProjectDump,getJSONFromModule} from "../src";
import {readFileSync, writeFileSync} from "fs";
import {resolve} from "path";

(async () => {
  const contentJson = await readFileSync(resolve(__dirname, "dump-meta.json"))
  const resultContent = toJSONFromProjectDump(contentJson.toString())
  writeFileSync(
    resolve(__dirname, "result.json"),
    JSON.stringify(resultContent)
  );



  // const contentJson = await readFileSync(resolve(__dirname, "dump-page.json"))
  // const resultContent = toJSONFromPageDump(contentJson.toString())
  // writeFileSync(
  //   resolve(__dirname, "result.json"),
  //   JSON.stringify(resultContent)
  // );


})();
