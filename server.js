import { serve } from "https://deno.land/std@0.151.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.151.0/http/file_server.ts";
import { CSV } from "https://js.sabae.cc/CSV.js";
import id_lat_lon_jsonData from "./public/id_lat_lon.json" assert { type: "json" };
import wbgt_people from "./public/wbgt_people.json" assert { type: "json" };


let pre_ids = [[11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], [31], [33], [34], [32], [35], [36], [40], [41], [42], [43], [45], [44], [46], [54], [55], [56], [57], [49], [48], [52], [50], [51], [53], [60], [61], [62], [63], [64], [65], [69], [68], [66], [67], [81], [71], [72], [73], [74], [82], [85], [84], [86], [83], [87], [88], [91, 92, 93, 94]];

serve(async (req) => {
  const pathname = new URL(req.url).pathname;
  console.log(pathname);

  // 暑さ指数予測取得
  if (req.method === "POST" && pathname === "/loc") { // POSTメソッド，cieパス
    const requestJson = await req.json();
    const lat = requestJson.lat; // 緯度
    const lon = requestJson.lon; // 経度
    // 最近座標の観測所idを特定
    const keys = Object.keys(id_lat_lon_jsonData);
    let tmp_dis = 1000.0;
    let id="";
    for (let i in keys) {
      let key = keys[i];
      let tmp_lat = id_lat_lon_jsonData[key][0];
      let tmp_lon = id_lat_lon_jsonData[key][1];
      let dis = ((lat - tmp_lat) ** 2 + (lon - tmp_lon) ** 2) ** (1 / 2) // ユークリッド距離の算出
      if (dis < tmp_dis) {
        tmp_dis = dis;
        id = key;
      }
    }
    let pre_id = -1;
    for (let i in pre_ids) {
      for (let j in pre_ids[i]) {
        if (pre_ids[i][j] == id.substr(0, 2)) {
          pre_id = Number(i);
        }
      }
    }

    async function callApi_wbgt(url_wbgt) {
      // CSV各行読み込み
      const data = CSV.toJSON(await CSV.fetch(url_wbgt))[0];
      let keys = Object.keys(data);
      let time = data[""].substr(0, 10).replace(/\//g, "");
      let max_key;
      let tmp_val = 0;
      for (let i in keys) {
        if (keys[i].substr(0, 8) == time) {
          let key = keys[i];
          let val = Number(data[key].substr(1));
          data[key] = val; // 数値をJSONobjに反映
          if (val > tmp_val) {
            tmp_val = val;
            max_key = key;
          }
        }
      }
      // let year = max_key.substr(0, 4);
      // let month = max_key.substr(4, 2);
      // let day = max_key.substr(6, 2);
      // let hour = max_key.substr(8);
      let wbgt_val = data[max_key]/10;
      let people_val = wbgt_people[pre_id][String(wbgt_val)];
      console.log(wbgt_val, people_val);
      return new Response(String(wbgt_val)+String(people_val));
    };
    const url_wbgt = 'https://www.wbgt.env.go.jp/prev15WG/dl/yohou_' + id + '.csv';
    callApi_wbgt(url_wbgt);
  }



  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});
