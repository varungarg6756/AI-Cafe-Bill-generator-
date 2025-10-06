const fileInput = document.querySelector("#fileInput");
const fileList = document.querySelector("#fileList");
const uploadForm = document.querySelector("#uploadForm");

const imageFiles = [];
fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  imageFiles.push(...files);
  files.forEach((image, index) => {
    const imgElement = document.createElement("div");
    imgElement.className = "group relative flex-shrink-0";
    imgElement.innerHTML = `  
    <img class="group-hover:opacity-50 transition-opacity duration-300 rounded-lg h-full select-none" src="${URL.createObjectURL(
      image
    )}" alt="" draggable="false">
    <svg class="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-md hidden group-hover:block hover:cursor-pointer group-hover:bg-red-500" xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M200-440v-80h560v80H200Z"/></svg>
    `;
    imgElement.querySelector("svg").addEventListener("click", (e) => {
      fileList.removeChild(imgElement);
      imageFiles.splice(index, 1);
    });
    fileList.appendChild(imgElement);
  });
  fileInput.value = "";
});

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (imageFiles.length === 0) {
    return;
  }

  document.querySelector("#formPage").classList.add("hidden");
  // document.querySelector("#resultPage").classList.remove("hidden");
  const response = await uploadImages();
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  const { done, value } = await reader.read(); // first buffer sent by the server will always be the menu
  // const menu = JSON.parse(decoder.decode(value, { stream: true }));

  console.log("menu received: ", decoder.decode(value, { stream: true }));

  //substiquent buffers will be the data
  let final_price = 0;
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    const chunk = decoder.decode(value, { stream: true }); //gives u string of obj,you can get {}\n{}\n or {}\n
    if (done) break;
    console.log("data received: ", decoder.decode(value, { stream: true }));
    buffer += chunk;
    const objects = buffer.split("\n");
    buffer = objects.pop();

    console.log("objs: ", objects);
    console.log("buffer:", buffer);

    objects.forEach((objectString) => {
      const product = JSON.parse(objectString); // product = {"name", "img", "price", "quantity"}
      console.log("parsed obj: ", product);
      addRow(product.name, product.quantity, product.price);

      final_price += product.price * product.quantity;
    });
  }

  document.querySelector("#total").innerHTML = `${final_price}$`;

  //done here, destroy loaders
  document.querySelector(".loader").remove();
  // document.createElement().nextSibling
  //   table.nextremove(table.lastElementChild);
});

document.querySelector("#browseButton").addEventListener("click", () => {
  fileInput.click();
});

async function uploadImages() {
  if (imageFiles.length === 0) {
    return;
  }
  const formData = new FormData();
  imageFiles.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch("/api/image", {
    method: "POST",
    body: formData,
  });

  return response;
}
