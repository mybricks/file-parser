import {toJSONFromPageDump, toJSONFromProjectDump,getJSONFromModule,parsePage} from "../src";
import {readFileSync, writeFileSync} from "fs";
import {resolve} from "path";

(async () => {
  const contentJson = await readFileSync(resolve(__dirname, "dump-page.json"))
  //global JSON
  const json = JSON.parse(contentJson.toString())
  const resultContent = parsePage(json.content)//meta 单页测试

  //render-web.transformToJSON(global,resultContent)

  writeFileSync(
    resolve(__dirname, "result.json"),
    JSON.stringify(resultContent)
  );



  // const contentJson = await readFileSync(resolve(__dirname, "dump-meta-page.json"))
  // //global JSON
  // const resultContent = toJSONFromPageDump(contentJson.toString())//meta 单页测试
  //
  // //render-web.transformToJSON(global,resultContent)
  //
  // writeFileSync(
  //   resolve(__dirname, "result.json"),
  //   JSON.stringify(resultContent)
  // );
  //
  
  
  // const contentJson = await readFileSync(resolve(__dirname, "dump-page.json"))
  // const resultContent = toJSONFromPageDump(contentJson.toString())
  // writeFileSync(
  //   resolve(__dirname, "result.json"),
  //   JSON.stringify(resultContent)
  // );
  
  
})();


// (async () => {
//   const contentJson = await readFileSync(resolve(__dirname, "dump-meta.json"))
//   const resultContent = toJSONFromProjectDump(contentJson.toString())
//   writeFileSync(
//     resolve(__dirname, "result.json"),
//     JSON.stringify(resultContent)
//   );
//
//
//
//   // const contentJson = await readFileSync(resolve(__dirname, "dump-page.json"))
//   // const resultContent = toJSONFromPageDump(contentJson.toString())
//   // writeFileSync(
//   //   resolve(__dirname, "result.json"),
//   //   JSON.stringify(resultContent)
//   // );
//
//
// })();
