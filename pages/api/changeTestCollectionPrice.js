export async function changeTestCollectionPrice(newPrice) {
  // read file and make object
  let content = JSON.parse(fs.readFileSync("testData.json", "utf8"));
  // edit or add property
  content.price = newPrice;
  //write file
  fs.writeFileSync("testData.json", JSON.stringify(content));
}
