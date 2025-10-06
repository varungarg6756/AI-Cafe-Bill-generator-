const table = document.querySelector("#table");

const rows = [];
function addRow(name = "dummy", quantity = 1, price = 20302) {
  console.log("adding row to", table);
  const row = document.createElement("div");
  table.appendChild(row);
  // table.insertBefore(row, table.querySelector(".loader"));
  // table.insertBefore(row, table.lastElementChild);
  row.outerHTML = `<div class="grid grid-cols-[20%_1fr_20%_20%] h-[50px] place-items-center">
                <p>${table.children.length}</p>
                <p class="w-full h-full border-x grid place-items-center">${name}</p>
                <p>${quantity}</p>
                <p class="w-full h-full border-l grid place-items-center">${
                  price * quantity
                }$ @${price}$/piece </p>
            </div> `;
}
