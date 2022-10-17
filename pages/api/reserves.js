import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";

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
    ".g.alchemy.com/nft/v2/" +
    process.env.ALCHEMY_API_KEY;

  const options = {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: {
      id: 1,
      jsonrpc: "2.0",
      method: "eth_getLogs",
      params: [
        {
          address: marketAddress,
          topics: [
            "0xe1866131bb60ded80b1b83df69d15c852b90d58e59bf343600ba772b38d0f031",
          ],
        },
      ],
    },
  };
  const getReservesResponse = await fetch(url, options).catch((err) =>
    console.error(err)
  );
  const reserves = await getReservesResponse.json();
  reserves.result.forEach((result) => {
    reservesAddresses.push({
      address: result.topics[1],
      block: result.blockNumber,
    });
  });

  res.status(200).json(reservesAddresses);
}
