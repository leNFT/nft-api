import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import { utils } from "ethers";
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

  const { chainId, reserve } = req.query;

  const setReserveTopic =
    "0xf9e7f47c2cd7655661046fbcf0164a4d4ac48c3cd9c0ed8b45410e965cc33714";

  const alchemySettings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: chainId == 1 ? Network.ETH_MAINNET : Network.ETH_GOERLI,
  };
  const alchemy = new Alchemy(alchemySettings);

  const marketAddress =
    chainId == 1
      ? process.env.MAINNET_MARKET_CONTRACT
      : process.env.GOERLI_MARKET_CONTRACT;

  var nfts = {};

  const response = await alchemy.core.getLogs({
    address: marketAddress,
    fromBlock: "earliest",
    toBlock: "latest",
    topics: [setReserveTopic],
  });

  console.log("response", response);
  const getNameFunctionSig = "0x06fdde03";

  for (let i = 0; i < response.length; i++) {
    const result = response[i];

    const nftAddress = utils.defaultAbiCoder.decode(
      ["address"],
      result.topics[1]
    )[0];

    console.log("nftAddress", nftAddress);
    const collectionNameResponse = await alchemy.core.call({
      to: nftAddress,
      data: getNameFunctionSig,
    });

    console.log("collectionNameResponse", collectionNameResponse);

    nfts[nftAddress] = {
      reserve: utils.defaultAbiCoder.decode(["address"], result.topics[3])[0],
      name: utils.defaultAbiCoder.decode(["string"], collectionNameResponse)[0],
    };
  }

  // If the user is asking for nfts supported by a specific reserve
  console.log("reserve", reserve);
  if (reserve) {
    var reserveNFTs = {};
    for (const nftAddress in nfts) {
      if (nfts[nftAddress].reserve == reserve) {
        reserveNFTs[nftAddress] = nfts[nftAddress];
      }
    }
    res.status(200).json(reserveNFTs);
  } else {
    res.status(200).json(nfts);
  }
}
