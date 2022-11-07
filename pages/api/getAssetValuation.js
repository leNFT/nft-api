import fetch from "node-fetch";
import { parseUnits } from "@ethersproject/units";
import contractAddresses from "../../contractAddresses.json";

export async function getAssetValuation(collection, tokenId) {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-api-key": process.env.UPSHOT_API_KEY,
    },
  };

  // Test collections case for goerli
  if (collection == contractAddresses["5"].GenesisNFT) {
    return parseUnits("0.025", 18);
  } else if (collection == "0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b") {
    return parseUnits("0.008", 18);
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
