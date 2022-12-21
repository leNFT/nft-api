import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import { ethers, utils } from "ethers";
import { Network, Alchemy } from "alchemy-sdk";
import contractAddresses from "../../contractAddresses.json";
import tradingPoolABI from "../../contracts/TradingPool.json";
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

  const { chainId, pool, amount } = req.query;
  const nftsArray = nfts.split(",");
  console.log("pool", pool);
  console.log("nftsArray", nftsArray);

  const alchemySettings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: chainId == 1 ? Network.ETH_MAINNET : Network.ETH_GOERLI,
  };
  const alchemy = new Alchemy(alchemySettings);
  const iface = new ethers.utils.Interface(tradingPoolABI);
  const nftToLpFunctionSig = "0x5460d849";
  const getLpFunctionSig = "0xcdd3f298";
  const priceAfterBuyFunctionSig = "0xbb1690e2";

  var lpBuyPrice = {};
  var buyQuote = { quote: "0", poolsCount: 0 };
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
    const lpId = iface.decodeFunctionResult("nftToLp", nftToLpResponse);

    const getLpResponse = await alchemy.core.call({
      to: pool,
      data:
        getLpFunctionSig +
        ethers.utils.defaultAbiCoder.encode(["uint256"], lpId).slice(2),
    });

    console.log("getLpResponse", getLpResponse);
    const lp = iface.decodeFunctionResult("getLP", getLpResponse);

    console.log("lp[0]", lp[0]);

    var currentPrice;
    if (lpBuyPrice[lpId] === undefined) {
      currentPrice = BigNumber.from(lp[0].price).toString();
      buyQuote["poolsCount"]++;
    } else {
      currentPrice = lpBuyPrice[lpId];
    }

    const getPriceAfterBuyResponse = await alchemy.core.call({
      to: lp[0].curve,
      data:
        priceAfterBuyFunctionSig +
        ethers.utils.defaultAbiCoder
          .encode(["uint256"], [currentPrice])
          .slice(2) +
        ethers.utils.defaultAbiCoder
          .encode(["uint256"], [lp[0].delta.toString()])
          .slice(2),
    });
    const priceAfterBuy = ethers.utils.defaultAbiCoder
      .decode(["uint256"], getPriceAfterBuyResponse)
      .toString();
    lpBuyPrice[lpId] = priceAfterBuy;

    buyQuote["quote"] = BigNumber.from(buyQuote["quote"])
      .add(priceAfterBuy)
      .toString();
  }

  res.status(200).json(buyQuote);
}
