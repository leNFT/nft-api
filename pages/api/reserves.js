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

  var chainName;
  var marketAddress;
  console.log(chainId);
  if (chainId == 1) {
    chainName = "eth";
    marketAddress = process.env.MAINNET_MARKET_CONTRACT;
  } else if (chainId == 5) {
    chainName = "goerli";
    marketAddress = process.env.GOERLI_MARKET_CONTRACT;
  } else {
    res.status(400).json({ error: "Invalid chainId" });
  }

  var reservesAddresses = [];

  const url =
    "https://eth-" +
    chainName +
    ".g.alchemy.com/v2/" +
    process.env.ALCHEMY_API_KEY;

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
          topics: [
            "0xd6b6991a74a763fbdaa73930e120d9590a2bcb82cbcb99e8bd873ba570708261",
          ],
        },
      ],
    }),
  };
  const getReservesResponse = await fetch(url, options).catch((err) =>
    console.error(err)
  );
  const reserves = await getReservesResponse.json();
  console.log("reserves", reserves);

  try {
    reserves.result.forEach((result) => {
      reservesAddresses.push({
        address: utils.defaultAbiCoder.decode(["address"], result.topics[1]),
        block: Number(result.blockNumber),
      });
    });
  } catch (error) {
    console.log(error);
  }

  res.status(200).json(reservesAddresses);
}
