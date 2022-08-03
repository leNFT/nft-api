import { getTokenValuation } from "./getTokenValuation.js";
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

  res.status(200).json((await getTokenValuation(address, tokenId)).toString());
}
