import abi from "web3-eth-abi";
import { utils } from "ethers";
import { getMessage } from "eip-712";
import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import contractAddresses from "../../contractAddresses.json";
import airdropAddressesList from "../../airdropAddresses.json";

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

  const { requestId, address, chainId } = req.query;
  const expiryTimestamp = Math.round(Date.now() / 1000) + ONE_HOUR;
  var returnData = {};

  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["1"];

  const airdropAddresses =
    chainId in airdropAddressesList
      ? airdropAddressesList[chainId]
      : airdropAddressesList["1"];

  console.log("Got an airdrop request for chainID:", chainId);
  if (!address) {
    //Check inputs
    res.status(400).json({ error: "Lacks input data" });
  }

  if (airdropAddresses[address]) {
    returnData.amount = airdropAddresses[address];
  } else {
    returnData.amount = 0;
    res.status(200).json(returnData);
  }

  if (requestId) {
    const payload = abi.encodeParameter(
      {
        AirdropDetails: {
          user: "address",
          amount: "uint256",
        },
      },
      {
        user: address,
        amount: airdropAddresses[address],
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
        verifyingContract: addresses.NativeToken,
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
