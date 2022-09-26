import fetch from "node-fetch";
import { parseUnits } from "@ethersproject/units";

export async function getAssetValuation(collection, tokenId) {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-api-key": process.env.UPSHOT_API_KEY,
    },
  };

  // Test collection case for goerli
  if (collection == "0x0171dB1e3Cc005d2A6E0BA531509D007a5B8C1a8") {
    return parseUnits("0.18", 18);
  }

  const url =
    "https://api.upshot.io/v2/assets/" +
    collection +
    "/" +
    tokenId +
    "?include_asset_stats=false&include_trait_stats=false";

  const assetResponse = await fetch(url, options).catch((err) =>
    console.error(err)
  );
  const asset = await assetResponse.json();
  if (asset.data === undefined) {
    return 0;
  } else {
    const priceEstimate = asset.data.appraisal.wei;
    const multiplier = 0.8;
    return priceEstimate * multiplier;
  }
}