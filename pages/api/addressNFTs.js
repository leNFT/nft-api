import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";

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

  const { address, collection, chainId } = req.query;

  var chainName;
  console.log(chainId);
  if (chainId == 1) {
    chainName = "eth";
  } else if (chainId == 5) {
    chainName = "goerli";
  } else {
    res.status(400).json({ error: "Invalid chainId" });
  }

  var collectionsURLString = "";
  if (collection) {
    collectionsURLString = "&contractAddresses[]=" + collection;
  }

  const url =
    "https://eth-" +
    chainName +
    ".g.alchemy.com/nft/v2/" +
    process.env.ALCHEMY_API_KEY +
    "/getNFTs";

  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const getNFTsResponse = await fetch(
    url + "?owner=" + address + collectionsURLString,
    options
  ).catch((err) => console.error(err));
  const nfts = await getNFTsResponse.json();

  console.log("nfts", nfts.ownedNfts);

  res.status(200).json(nfts.ownedNfts);
}
