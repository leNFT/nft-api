import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import contractAddresses from "../../contractAddresses.json";
import { parseUnits } from "@ethersproject/units";

// Initialize the cors middleware
const cors = initMiddleware(
  // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
  Cors({
    // Only allow requests with GET and from the frontend
    methods: ["GET"],
    origin: [
      "https://lenft.finance",
      "http://localhost:3000",
      "https://lenft.fi",
    ],
  })
);

export default async function handler(req, res) {
  // Run cors
  await cors(req, res);

  const { address, chainId } = req.query;
  var floorPrice = "0";

  console.log("Got a price request for chainID:", chainId);
  if (!(address && chainId)) {
    //Check inputs
    res.status(400).json({ error: "Lacks input data" });
  }

  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["1"];

  // Test collections case for goerli
  if (chainId == "5") {
    if (address == addresses.GenesisNFT) {
      returnData.floorPrice = parseUnits("0.025", 18).toString();
    } else if (address == "0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b") {
      returnData.price = parseUnits("0.008", 18).toString();
    } else if (address == "0x0171dB1e3Cc005d2A6E0BA531509D007a5B8C1a8") {
      returnData.floorPrice = parseUnits("0.01", 18).toString();
    } else if (address == "0x932Ca55B9Ef0b3094E8Fa82435b3b4c50d713043") {
      returnData.floorPrice = parseUnits("0.01", 18).toString();
    }
    // Mainnet Case
  } else {
    const options = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-key": process.env.UPSHOT_API_KEY,
      },
    };

    const url = "https://api.upshot.xyz/v2/collections/" + address;

    const collectionResponse = await fetch(url, options).catch((err) =>
      console.error(err)
    );
    const collection = await collectionResponse.json();

    //Build return data
    console.log(collection);
    if (collection.data) {
      floorPrice = collection.data.floor.wei;
    }
  }

  res.status(200).json(floorPrice);
}
