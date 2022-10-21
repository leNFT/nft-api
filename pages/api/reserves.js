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
  const createReserveTopic =
    "0x62bc44df7dccd51a32794da404454232658add2bef839a8e3629ed5c980daabf";
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

  var reserves = {};
  var supportedNFTs = {};

  const url = "https://eth-" + chainName + ".g.alchemy.com/v2/" + apiKey;

  var options = {
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
          topics: [createReserveTopic],
        },
      ],
    }),
  };
  var getResponse = await fetch(url, options).catch((err) =>
    console.error(err)
  );
  var response = await getResponse.json();

  try {
    // Go through each event
    response.result.forEach((element) => {
      reserves[utils.defaultAbiCoder.decode(["address"], element.topics[1])] = {
        block: Number(element.blockNumber),
        assets: [],
      };
    });
  } catch (error) {
    console.log(error);
  }

  options = {
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
  getResponse = await fetch(url, options).catch((err) => console.error(err));
  response = await getResponse.json();

  try {
    response.result.forEach((element) => {
      console.log("element", element.topics);
      supportedNFTs[
        utils.defaultAbiCoder.decode(["address"], element.topics[1])
      ] = {
        reserve: utils.defaultAbiCoder.decode(
          ["address"],
          element.topics[3]
        )[0],
      };
    });
  } catch (error) {
    console.log(error);
  }

  console.log("reserves", reserves);
  console.log("supportedNFTs", supportedNFTs);

  // Build answer
  for (const [key, value] of Object.entries(supportedNFTs)) {
    console.log("key", key);
    console.log("value", value);
    reserves[value.reserve].assets.push(key);
  }

  res.status(200).json(reserves);
}
