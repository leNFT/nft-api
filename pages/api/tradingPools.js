import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import { utils } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import contractAddresses from "../../contractAddresses.json";
import { Network, Alchemy } from "alchemy-sdk";

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
  const createTradingPoolTopic =
    "0xa1311e5e3c1c2207844ec9211cb2439ea0bce2a76c6ea09d9343f0d0eaddd9f6";

  const alchemySettings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: chainId == 1 ? Network.ETH_MAINNET : Network.ETH_GOERLI,
  };
  const alchemy = new Alchemy(alchemySettings);

  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["1"];

  var tradingPools = {};

  const tradingPoolsResponse = await alchemy.core.getLogs({
    address: addresses.TradingPoolFactory,
    fromBlock: "earliest",
    toBlock: "latest",
    topics: [createTradingPoolTopic],
  });

  try {
    // Go through each event
    tradingPoolsResponse.forEach((element) => {
      tradingPools[
        utils.defaultAbiCoder.decode(["address"], element.topics[1])
      ] = {
        nft: utils.defaultAbiCoder.decode(["address"], element.topics[2]),
        token: utils.defaultAbiCoder.decode(["address"], element.topics[3]),
      };
    });
  } catch (error) {
    console.log(error);
  }

  res.status(200).json(tradingPools);
}
