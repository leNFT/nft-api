import fetch from "node-fetch";

export async function getBestBid(collection, tokenId) {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-API-KEY": process.env.MODULE_API_KEY,
    },
  };

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
