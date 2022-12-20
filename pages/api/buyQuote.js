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

  const nftToLpFunctionSig = "0x5460d849";
  const getLpFunctionSig = "0xcdd3f298";

  var boughtFromLpCount = {};
  var buyQuote = {};
  for (let i = 0; i < nftsArray.length; i++) {
    const nftToLpResponse = await alchemy.core.call({
      to: pool,
      data:
        nftToLpFunctionSig +
        ethers.nftToLpFunctionSig.defaultAbiCoder
          .encode(["uint256"], [nftsArray[i]])
          .slice(2),
    });
    const lpId = ethers.utils.defaultAbiCoder.decode(
      ["uint256"],
      [nftToLpResponse]
    );
    console.log("lpId", lpId);

    const getLpResponse = await alchemy.core.call({
      to: pool,
      data:
        getLpFunctionSig +
        ethers.nftToLpFunctionSig.defaultAbiCoder
          .encode(["uint256"], [lpId])
          .slice(2),
    });

    console.log("getLpResponse", getLpResponse);
  }

  res.status(200).json(buyQuote);
}
