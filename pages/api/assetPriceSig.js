import abi from "web3-eth-abi";
import { utils } from "ethers";
import { getMessage } from "eip-712";
import { getAssetValuation } from "./getAssetValuation.js";
import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";

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

  const { requestId, tokenId, address, chainId } = req.query;
  const expiryTimestamp = Math.round(Date.now() / 1000) + ONE_HOUR;
  var verifyingContract;

  console.log("Got a price request for chainID:", chainId);
  if (chainId == 1) {
    verifyingContract = process.env.MAINNET_VERIFYING_CONTRACT;
  } else if (chainId == 5) {
    verifyingContract = process.env.GOERLI_VERIFYING_CONTRACT;
  }
  if (!(tokenId && address)) {
    //Check inputs
    res.status(400).json({ error: "Lacks input data" });
  }

  const payload = abi.encodeParameter(
    {
      TokenPriceBoost: {
        collection: "address",
        tokenId: "uint256",
        amount: "uint256",
      },
    },
    {
      collection: address,
      tokenId: tokenId,
      amount: await getAssetValuation(address, tokenId),
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
      verifyingContract: verifyingContract,
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

  res.status(200).json(sigPacket);
}
