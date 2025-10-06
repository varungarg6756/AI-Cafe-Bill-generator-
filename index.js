import OpenAI from "openai";
import express from "express";
import multer from "multer";
import "dotenv/config";
import { promises as fs } from "fs";

// const client = new OpenAI({
//   baseURL: "https://models.github.ai/inference",
//   apiKey: process.env.GITHUB_API_TOKEN,
// });
// const model = "openai/gpt-4.1";
// const model = "openai/gpt-4.1-mini";

// const client = new OpenAI({
//   baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
//   apiKey: process.env.GEMINI_API_KEY,
// });

const model = "gemini-2.5-pro";
// const model = "gemini-2.5-flash";
export async function askModel(messages) {
  const response = await client.chat.completions.create({
    model: model,
    messages,
    temperature: 0,
  });

  return response.choices[0].message.content;
}

export async function loadDataset() {
  const dataset = [];
  const menu = await getMenu();
  for (const product of menu) {
    const imgName = product.img;
    const image_data = await fs.readFile(
      `${process.env.ITEM_IMG_DIR}/${imgName}`,
      { encoding: "base64" }
    );

    const mimeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    };
    const mimetype = mimeMap[imgName.split(".")[1]];

    const obj = {
      type: "image_url",
      image_url: {
        url: `data:${mimetype};base64,${image_data.toString("base64")}`,
      },
    };
    const name = {
      type: "text",
      text: product.name,
    };
    dataset.push(obj);
    dataset.push(name);
  }

  console.log("Dataset loaded with", dataset.length / 2, "images");
  return dataset;
}

const upload = multer();

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile("public/index.html");
});

const prompt = `
You are given some image of food products and names of those products in the next message to each of the images. 

You will also receive a **new image**. This new image may show one or more units of a product from the dataset, or something completely different.

### Your Task:

1. Compare the new image to the dataset images.
2. Identify **which product** from the dataset appears in the image, based on visual similarity.
3. Count **how many units** of that product are present in the image.
4. If the new image **does not** match any product in the dataset (visually too different), or
you see even slight Variance, for example : a cookie in the image looking a little large or different design than the one provided in the dataset, give [], Guessing randomly is worse than guessing nothing

IF you dont find a match, return:

[]

5. Otherwise, return only the **closest matching product** in the following JSON format:

[
{"name<>":"<name of the product matched from the dataset", "quantity": "<number of items detected>"},
{"name":"<name of the product matched from the dataset", "quantity": "<number of items detected>"},
{"name":"<name of the product matched from the dataset", "quantity": "<number of items detected>"},
...
]


Do not output anything else — only this JSON. Output raw JSON. Do NOT use any triple backticks or code blocks. The response must be plain text only.

Examples of a valid return : 

1. [{ "name" : "croissant" , "quantity" : 6},{ "name" : "Cheese Quiche", "quantity" : 1 }, {"name" : "Triple Chip Chocolate cookie", "quantity" : 1}]
2. [{ "name" : "Pastry frank", "quantity" : 2}]
3. []

Examples of invalid returns:  

1. [{"name" : 2, quantity: "2" }] (the quantity 2 must be a number and name must be a string)

`;
app.post("/api/image", upload.array("images", 12), async (req, res) => {
  const menu = await getMenu();
  res.write(JSON.stringify(menu));

  const dataset = await loadDataset();

  if (dataset.length === 0) {
    res.status(500).json({ error: "No images found in dataset." });
    return;
  }

  // processing the uploaded images
  for (const file of req.files) {
    let response = await askModel([
      {
        role: "user",
        content: dataset,
      },
      {
        role: "user",
        content: prompt,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${file.mimetype};base64,${file.buffer.toString(
                "base64"
              )}`,
            },
          },
        ],
      },
    ]);

    console.log("response from AI: ", response);
    const menu = await getMenu(); // menu = [{"name" : "pizza", "img": "pizza.jpg", "price": 1.5 }]
    response = JSON.parse(response); // response = [{"name": "pizza", "quantity": 5},....]
    response.forEach((detectedItem) => {
      //detectedItem = {"name": "pizza", "quantity": 5}
      const product = menu.find((obj) => obj.name === detectedItem.name); // product = {"name" : "pizza", "img": "pizza.jpg", "price": 1.5 }
      const obj = {
        name: product.name,
        price: product.price,
        quantity: detectedItem.quantity,
      };
      console.log("sending item: ", obj);
      res.write(JSON.stringify(obj) + "\n");
    });
  }

  res.end();
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

let menu;
async function getMenu() {
  if (menu) {
    return menu;
  }
  menu = JSON.parse(await fs.readFile(process.env.MENU_LOCATION, "utf-8"));
  return menu;
}
