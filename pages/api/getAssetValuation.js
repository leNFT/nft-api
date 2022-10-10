import fetch from "node-fetch";
import { parseUnits } from "@ethersproject/units";
import testData from "./testData.json";

export async function getAssetValuation(collection, tokenId) {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-api-key": process.env.UPSHOT_API_KEY,
    },
  };

  // Test collection case for goerli
  if (collection == testData.collection) {
    return parseUnits(testData.price, 18);
  }

  const url = "https://api.upshot.xyz/v2/assets/" + collection + "/" + tokenId;

  const assetResponse = await fetch(url, options).catch((err) =>
    console.error(err)
  );
  const asset = await assetResponse.json();
  if (asset.data.appraisal === undefined) {
    return 0;
  } else {
    const priceEstimate = asset.data.appraisal.wei;
    const multiplier = 0.8;
    return priceEstimate * multiplier;
  }
}
