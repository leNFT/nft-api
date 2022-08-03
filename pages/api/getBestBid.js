import fetch from "node-fetch";
import { parseUnits } from "@ethersproject/units";

export async function getBestBid(collection, tokenId) {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-API-KEY": process.env.MODULE_API_KEY,
    },
  };

  if (collection == "0x9fbf133ea8f0a0fd5617705d090256e488f770d3") {
    return parseUnits("3", 18);
  }

  const tokenBestBidResponse = await fetch(
    "https://api.modulenft.xyz/api/v1/opensea/token/bestBid?tokenId=" +
      tokenId +
      "&collection=" +
      collection,
    options
  ).catch((err) => console.error(err));
  const tokenBestBid = await tokenBestBidResponse.json();

  return parseUnits(tokenBestBid.info.bestBid["price"], 18);
}
