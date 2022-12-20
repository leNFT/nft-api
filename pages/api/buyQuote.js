import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import { ethers, utils } from "ethers";
import { Network, Alchemy } from "alchemy-sdk";
import contractAddresses from "../../contractAddresses.json";

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

  const { chainId, pool, nfts } = req.query;
  const nftsArray = nfts.split(",");
  console.log("pool", pool);
  console.log("nftsArray", nftsArray);

  const alchemySettings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: chainId == 1 ? Network.ETH_MAINNET : Network.ETH_GOERLI,
  };
  const alchemy = new Alchemy(alchemySettings);

  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["1"];

  const getNftIdLPFunctionSig = "0xde8a8949";
  var boughtFromLpCount = {};
  var buyQuote = {};
  for (let i = 0; i < nftsArray.length; i++) {
    const lpResponse = await alchemy.core.call({
      to: pool,
      data:
        getNftIdLPFunctionSig +
        ethers.utils.defaultAbiCoder
          .encode(["uint256"], [nftsArray[i]])
          .slice(2),
    });

    console.log("lpResponse", lpResponse);
  }

  res.status(200).json(buyQuote);
}
