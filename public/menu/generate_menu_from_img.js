import { promises as fs } from "fs";

const input = "public/menu/item_img";
const output = "public/menu/menu.json";

function getRandom25Multiple() {
  const min = 5;
  const max = 25;
  const step = 2.5;

  const count = Math.floor((max - min) / step) + 1; // number of possible values
  const randomIndex = Math.floor(Math.random() * count);
  return min + randomIndex * step;
}

async function main() {
  const files = await fs.readdir(input);
  const menu_json = [];
  for (const file of files) {
    if (
      file.endsWith(".png") &&
      file.endsWith(".jpeg") &&
      file.endsWith(".jpg")
    ) {
      continue;
    }
    const obj = {
      name: file.split(".")[0],
      img: file,
      price: getRandom25Multiple(),
    };
    menu_json.push(obj);
  }

  fs.writeFile(output, JSON.stringify(menu_json));
  console.log("file ready!", menu_json);
}

main();
