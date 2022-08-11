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

  //Test collection on test network
  if (collection == "0x578F3dBa2366dc52f46305E25f3BC7bcE9229819") {
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
