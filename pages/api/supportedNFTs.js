import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import { utils } from "ethers";

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

  const { chainId } = req.query;

  const setReserveTopic =
    "0xf9e7f47c2cd7655661046fbcf0164a4d4ac48c3cd9c0ed8b45410e965cc33714";

  var chainName;
  var marketAddress;
  var apiKey;

  console.log(chainId);
  if (chainId == 1) {
    chainName = "eth";
    marketAddress = process.env.MAINNET_MARKET_CONTRACT;
    apiKey = process.env.MAINNET_ALCHEMY_API_KEY;
  } else if (chainId == 5) {
    chainName = "goerli";
    marketAddress = process.env.GOERLI_MARKET_CONTRACT;
    apiKey = process.env.GOERLI_ALCHEMY_API_KEY;
  } else {
    res.status(400).json({ error: "Invalid chainId" });
  }

  var nfts = {};

  const url = "https://eth-" + chainName + ".g.alchemy.com/v2/" + apiKey;

  const options = {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_getLogs",
      params: [
        {
          address: marketAddress,
          fromBlock: "earliest",
          toBlock: "latest",
          topics: [setReserveTopic],
        },
      ],
    }),
  };
  const getResponse = await fetch(url, options).catch((err) =>
    console.error(err)
  );
  const response = await getResponse.json();
  console.log("response", response);

  try {
    response.result.forEach((result) => {
      nfts[utils.defaultAbiCoder.decode(["address"], result.topics[1])] = {
        reserve: utils.defaultAbiCoder.decode(["address"], result.topics[3])[0],
      };
    });
  } catch (error) {
    console.log(error);
  }

  res.status(200).json(nfts);
}
