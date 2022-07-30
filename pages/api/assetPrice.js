import { getBestBid } from "./getBestBid.js";
import { parseUnits } from "@ethersproject/units";

export default async function handler(req, res) {
  const { tokenId, address } = req.query;

  console.log("address", address);

  //Check inputs
  if (!(tokenId && address)) {
    res.status(400).json({ error: "Lacks input data" });
  }

  var bestBid;
  //Test NFT
  if (address == "0x9fbf133ea8f0a0fd5617705d090256e488f770d3") {
    bestBid = parseUnits("2", 18);
  } else {
    bestBid = await getBestBid(address, tokenId);
  }

  res.status(200).json(bestBid.toString());
}
