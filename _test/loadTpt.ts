import {getPageTemplateJSONFromDumpJson} from "../src";
import {readFileSync, writeFileSync} from "fs";
import {resolve} from "path";

(async () => {
  const contentJson = await readFileSync(resolve(__dirname, "for-ai-tpt-dumpJson.json"))
  //global JSON
  const resultContent = getPageTemplateJSONFromDumpJson(contentJson)//meta 单页测试

  //render-web.transformToJSON(global,resultContent)

  writeFileSync(
    resolve(__dirname, "for-ai-tpt.json"),
    JSON.stringify(resultContent)
  );
  
  
})()