import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import { ethers, utils } from "ethers";
import { Network, Alchemy } from "alchemy-sdk";
import contractAddresses from "../../contractAddresses.json";
import { BigNumber } from "@ethersproject/bignumber";

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
  const priceAfterBuyFunctionSig = "0xbb1690e2";

  var lpBuyPrice = {};
  var buyQuote = {};
  for (let i = 0; i < nftsArray.length; i++) {
    const nftToLpResponse = await alchemy.core.call({
      to: pool,
      data:
        nftToLpFunctionSig +
        ethers.utils.defaultAbiCoder
          .encode(["uint256"], [nftsArray[i]])
          .slice(2),
    });
    console.log("nftToLpResponse", nftToLpResponse);
    const lpId = ethers.utils.defaultAbiCoder.decode(
      ["uint256"],
      nftToLpResponse
    );

    const getLpResponse = await alchemy.core.call({
      to: pool,
      data:
        getLpFunctionSig +
        ethers.utils.defaultAbiCoder.encode(["uint256"], lpId).slice(2),
    });

    console.log("getLpResponse", getLpResponse);

    const lp = ethers.utils.defaultAbiCoder.decode(
      [
        "uint256[] nftIds",
        "uint256 tokenAmount",
        "address curve",
        "uint256 delta",
        "uint256 price",
      ],
      getLpResponse
    );

    console.log("lp", lp);

    if (lpBuyPrice[lpId]) {
      price = lpBuyPrice[lpId];
    } else {
      price = lp.price;
    }
    const getPriceAfterBuyResponse = await alchemy.core.call({
      to: lp.curve,
      data:
        priceAfterBuyFunctionSig +
        ethers.utils.defaultAbiCoder.encode(["uint256"], price).slice(2) +
        ethers.utils.defaultAbiCoder.encode(["uint256"], lp.delta).slice(2),
    });
    lpBuyPrice[lpId] = ethers.utils.defaultAbiCoder.decode(
      ["uint256"],
      getPriceAfterBuyResponse
    );
    console.log("lpBuyPrice[lpId]", lpBuyPrice[lpId]);
    buyQuote["quote"] += lpBuyPrice[lpId];
  }

  res.status(200).json(buyQuote);
}
