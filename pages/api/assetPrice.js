import { getBestBid } from "./getBestBid.js";
import { parseUnits } from "@ethersproject/units";
import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";

// Initialize the cors middleware
const cors = initMiddleware(
  // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
  Cors({
    // Only allow requests with GET and from the frontend
    methods: ["GET"],
    origin: ["https://lenft.finance", "http://localhost:3000"],
  })
);

export default async function handler(req, res) {
  // Run cors
  await cors(req, res);

  const { tokenId, address } = req.query;

  console.log("address", address);

  //Check inputs
  if (!(tokenId && address)) {
    res.status(400).json({ error: "Lacks input data" });
  }

  var bestBid;
  //Test NFT
  if (address == "0x9fbf133ea8f0a0fd5617705d090256e488f770d3") {
    bestBid = parseUnits("3", 18);
  } else {
    bestBid = await getBestBid(address, tokenId);
  }

  res.status(200).json(bestBid.toString());
}
