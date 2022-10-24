import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import { utils } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
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
  const createReserveTopic =
    "0x62bc44df7dccd51a32794da404454232658add2bef839a8e3629ed5c980daabf";
  const setReserveTopic =
    "0xf9e7f47c2cd7655661046fbcf0164a4d4ac48c3cd9c0ed8b45410e965cc33714";

  const alchemySettings = {
    apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
    network: chainId == 1 ? Network.ETH_MAINNET : Network.ETH_GOERLI, // Replace with your network.
  };
  const alchemy = new Alchemy(alchemySettings);

  const marketAddress =
    chainId == 1
      ? process.env.MAINNET_MARKET_CONTRACT
      : process.env.GOERLI_MARKET_CONTRACT;

  var reserves = {};
  var supportedNFTs = {};

  const reservesResponse = await alchemy.core.getLogs({
    address: marketAddress,
    fromBlock: "earliest",
    toBlock: "latest",
    topics: [createReserveTopic],
  });

  try {
    // Go through each event
    reservesResponse.forEach((element) => {
      reserves[utils.defaultAbiCoder.decode(["address"], element.topics[1])] = {
        assets: [],
        balance: "",
      };
    });
  } catch (error) {
    console.log(error);
  }

  const supportedNFTsResponse = await alchemy.core.getLogs({
    address: marketAddress,
    fromBlock: "earliest",
    toBlock: "latest",
    topics: [setReserveTopic],
  });

  try {
    supportedNFTsResponse.forEach((element) => {
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

  // Add details about the reserve to the response
  const getNameFunctionSig = "0x06fdde03";

  // Get NFT names and add them to response
  for (const [key, value] of Object.entries(supportedNFTs)) {
    console.log("key", key);
    console.log("value", value);

    const collectionNameResponse = await alchemy.core.call({
      to: key,
      data: getNameFunctionSig,
    });
    console.log("name response", collectionNameResponse);
    reserves[value.reserve].assets.push({
      address: key,
      name: utils.toUtf8String(
        "0x" + collectionNameResponse.substring(130).replace(/0+$/, "")
      ),
    });
  }

  // Add details about the reserve to the response
  const getUnderlyingFunctionSig = "0xe2c67439";
  const getSupplyRateFunctionSig = "0x84bdc9a8";
  const getBorrowRateFunctionSig = "0xba1c5e80";

  for (const key in reserves) {
    console.log("key", key);

    const underlyingResponse = await alchemy.core.call({
      to: key,
      data: getUnderlyingFunctionSig,
    });
    console.log("underlyingResponse", underlyingResponse);
    reserves[key].balance = BigNumber.from(underlyingResponse).toString();

    const supplyRateResponse = await alchemy.core.call({
      to: key,
      data: getSupplyRateFunctionSig,
    });
    console.log("supplyRateResponse", supplyRateResponse);
    reserves[key].supplyRate = BigNumber.from(supplyRateResponse).toNumber();

    const borrowRateResponse = await alchemy.core.call({
      to: key,
      data: getBorrowRateFunctionSig,
    });
    console.log("borrowRateResponse", borrowRateResponse);
    reserves[key].borrowRate = BigNumber.from(borrowRateResponse).toNumber();
  }

  res.status(200).json(reserves);
}
