import abi from "web3-eth-abi";
import { utils } from "ethers";
import { getMessage } from "eip-712";
import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import contractAddresses from "../../contractAddresses.json";
import { parseUnits } from "@ethersproject/units";

const ONE_HOUR = 3600;
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

  const { requestId, tokenId, collection, chainId } = req.query;
  const expiryTimestamp = Math.round(Date.now() / 1000) + ONE_HOUR;
  var returnData = {};

  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["1"];

  console.log("Got a price request for chainID:", chainId);
  if (!(tokenId && collection && chainId)) {
    //Check inputs
    res.status(400).json({ error: "Lacks input data" });
  }

  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-api-key": process.env.UPSHOT_API_KEY,
    },
  };

  // Test collections case for goerli
  if (collection == addresses.GenesisNFT) {
    returnData.price = parseUnits("0.025", 18).toString();
  } else if (collection == "0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b") {
    returnData.price = parseUnits("0.008", 18).toString();
  } else {
    const url =
      "https://api.upshot.xyz/v2/assets/" + collection + "/" + tokenId;

    const assetResponse = await fetch(url, options).catch((err) =>
      console.error(err)
    );
    const asset = await assetResponse.json();
    if (asset.data.appraisal === undefined) {
      return 0;
    } else {
      const priceEstimate = asset.data.appraisal.wei;
      const multiplier = 0.8;
      returnData.price = priceEstimate * multiplier;
    }
  }

  if (requestId) {
    const payload = abi.encodeParameter(
      {
        AssetPrice: {
          collection: "address",
          tokenId: "uint256",
          amount: "uint256",
        },
      },
      {
        collection: collection,
        tokenId: tokenId,
        amount: returnData.price,
      }
    );

    //Sign the payload and build the packet
    const typedData = {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        VerifyPacket: [
          { name: "request", type: "bytes32" },
          { name: "deadline", type: "uint256" },
          { name: "payload", type: "bytes" },
        ],
      },
      primaryType: "VerifyPacket",
      domain: {
        name: "leNFT",
        version: "1",
        chainId: chainId,
        verifyingContract: addresses.NFTOracle,
      },
      message: {
        request: requestId,
        deadline: expiryTimestamp,
        payload: payload,
      },
    };

    const signingKey = new utils.SigningKey(process.env.SERVER_PRIVATE_KEY);

    // Get a signable message from the typed data
    const message = getMessage(typedData, true);

    // Sign the message with the private key
    const { r, s, v } = signingKey.signDigest(message);

    const sigPacket = {
      v: v,
      r: r,
      s: s,
      request: requestId,
      deadline: expiryTimestamp,
      payload: payload,
    };

    returnData.sig = sigPacket;
  }

  res.status(200).json(returnData);
}
