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
  const getNameFunctionSig = "0x06fdde03";

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
    for (let i = 0; i < tradingPoolsResponse.length; i++) {
      const element = tradingPoolsResponse[i];

      const nftAddress = utils.defaultAbiCoder.decode(
        ["address"],
        element.topics[2]
      )[0];
      const tokenAddress = utils.defaultAbiCoder.decode(
        ["address"],
        element.topics[3]
      )[0];
      const poolAddress = utils.defaultAbiCoder.decode(
        ["address"],
        element.topics[1]
      )[0];

      const tokenNameResponse = await alchemy.core.call({
        to: tokenAddress,
        data: getNameFunctionSig,
      });

      const nftNameResponse = await alchemy.core.call({
        to: nftAddress,
        data: getNameFunctionSig,
      });

      const nftName = utils.defaultAbiCoder.decode(
        ["string"],
        nftNameResponse
      )[0];
      const tokenName = utils.defaultAbiCoder.decode(
        ["string"],
        tokenNameResponse
      )[0];

      tradingPools[poolAddress] = {
        nft: {
          name: nftName,
          address: nftAddress,
        },
        token: {
          name: tokenName,
          address: tokenAddress,
        },
      };

      console.log(tradingPools[poolAddress]);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }

  res.status(200).json(tradingPools);
}
