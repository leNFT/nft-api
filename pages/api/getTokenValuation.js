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

  // Test collection case for goerli
  if (collection == "0x0171dB1e3Cc005d2A6E0BA531509D007a5B8C1a8") {
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
