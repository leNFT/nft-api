import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import { utils } from "ethers";
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

  const { chainId } = req.query;
  const createReserveTopic =
    "0x62bc44df7dccd51a32794da404454232658add2bef839a8e3629ed5c980daabf";
  const setReserveTopic =
    "0xf9e7f47c2cd7655661046fbcf0164a4d4ac48c3cd9c0ed8b45410e965cc33714";

  var chainName;
  var marketAddress;
  console.log(chainId);
  if (chainId == 1) {
    chainName = "eth";
    marketAddress = process.env.MAINNET_MARKET_CONTRACT;
  } else if (chainId == 5) {
    chainName = "goerli";
    marketAddress = process.env.GOERLI_MARKET_CONTRACT;
  } else {
    res.status(400).json({ error: "Invalid chainId" });
  }

  var reserves = {};
  var supportedNFTs = {};

  const baseUrl =
    "https://eth-" +
    chainName +
    ".g.alchemy.com/v2/" +
    process.env.ALCHEMY_API_KEY;

  const getReservesOptions = {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_getLogs",
      params: [
        {
          address: marketAddress,
          fromBlock: "earliest",
          toBlock: "latest",
          topics: [createReserveTopic],
        },
      ],
    }),
  };
  const getReservesResponse = await fetch(baseUrl, getReservesOptions).catch(
    (err) => console.error(err)
  );
  const reservesResponse = await getReservesResponse.json();

  try {
    // Go through each event
    reservesResponse.result.forEach((element) => {
      reserves[utils.defaultAbiCoder.decode(["address"], element.topics[1])] = {
        block: Number(element.blockNumber),
        assets: [],
        balance: "",
      };
    });
  } catch (error) {
    console.log(error);
  }

  const getSupportedNFTsOptions = {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_getLogs",
      params: [
        {
          address: marketAddress,
          fromBlock: "earliest",
          toBlock: "latest",
          topics: [setReserveTopic],
        },
      ],
    }),
  };
  const getSupportedNFTsResponse = await fetch(
    baseUrl,
    getSupportedNFTsOptions
  ).catch((err) => console.error(err));
  const supportedNFTsResponse = await getSupportedNFTsResponse.json();

  try {
    supportedNFTsResponse.result.forEach((element) => {
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

    const getCollectionNameOptions = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: key, data: getNameFunctionSig }],
      }),
    };

    const getCollectionNameResponse = await fetch(
      baseUrl,
      getCollectionNameOptions
    ).catch((err) => console.error(err));
    const collectionNameResponse = await getCollectionNameResponse.json();
    console.log("name response", collectionNameResponse);
    reserves[value.reserve].assets.push({
      address: key,
      name: utils.toUtf8String(collectionNameResponse.result),
    });
  }

  // Add details about the reserve to the response
  const getUnderlyingFunctionSig = "0xe2c67439";

  for (const key in reserves) {
    console.log("key", key);
    // Get reserve underlying balance and add it to the response
    const getUnderlyingOptions = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: key, data: getUnderlyingFunctionSig }],
      }),
    };

    const getUnderlyingResponse = await fetch(
      baseUrl,
      getUnderlyingOptions
    ).catch((err) => console.error(err));
    const underlyingResponse = await getUnderlyingResponse.json();
    console.log("underlyingResponse", underlyingResponse);

    reserves[key].balance = BigNumber.from(
      underlyingResponse.result
    ).toString();
  }

  res.status(200).json(reserves);
}
