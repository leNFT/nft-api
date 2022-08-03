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

  if (collection == "0x9fbf133ea8f0a0fd5617705d090256e488f770d3") {
    return parseUnits("3", 18);
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
  console.log("tokenValuation", tokenValuation);
  console.log("priceEstimate", priceEstimate);
  console.log("confidence", confidence);

  return priceEstimate * confidence;
}
