import fetch from "node-fetch";
import { parseUnits } from "@ethersproject/units";

export async function getTokenValuation(collection, tokenId) {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-api-key": process.env.UPSHOT_API_KEY,
    },
  };

  if (collection == "0xaa8651f1c0419d108fe0a1303e0da692a42850e7") {
    return parseUnits("0.4", 18);
  }

  const tokenValuationResponse = await fetch(
    "https://api.upshot.io/v1/prices/latest?assetId=" +
      collection +
      "/" +
      tokenId,
    options
  ).catch((err) => console.error(err));
  const tokenValuation = await tokenValuationResponse.json();
  const priceEstimate = tokenValuation.data[0].currentPricing.estimatedPrice;
  const confidence = tokenValuation.data[0].currentPricing.confidence;

  return priceEstimate * confidence;
}
