import fetch from "node-fetch";
import * as fs from "fs";

const colllection = "0xed5af388653567af2f388e6224dc7c4b3241c544";

async function main() {
  //Get every tokenID for the colllection
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-API-KEY": process.env.MODULE_API_KEY,
    },
  };

  const tokenIDsResponse = await fetch(
    "https://api.modulenft.xyz/api/v1/ethereum/erc721/getAllTokenIDs?contractAddress=" +
      colllection,
    options
  ).catch((err) => console.error(err));

  // Array with token ids
  const tokenIDs = await tokenIDsResponse.json();

  var assetsPerLoop = 100;
  var tokensInfo = [];
  var getMetadataParams = "";
  var getBestBidParams = "";

  // Loop through token batches and get their best bids and metadata
  for (let loop = 0; loop < tokenIDs.length / assetsPerLoop; loop++) {
    // Reset variables
    getMetadataParams = "";
    getBestBidParams = "";

    for (
      let index = assetsPerLoop * loop;
      index < assetsPerLoop * (loop + 1);
      index++
    ) {
      const tokenID = tokenIDs[index];
      getMetadataParams = getMetadataParams.concat("&tokenId=" + tokenID);

      // If its the first token in the batch we concat differently
      if (index == assetsPerLoop * loop) {
        getBestBidParams = getBestBidParams.concat(
          tokenID + "%3A" + colllection
        );
      } else {
        getBestBidParams = getBestBidParams.concat(
          "&tokenQuery=" + tokenID + "%3A" + colllection
        );
      }
    }

    // Get the metadata of tokens in collection
    const tokensMetadataResponse = await fetch(
      "https://api.modulenft.xyz/api/v1/metadata/metadata?contractAddress=" +
        colllection +
        getMetadataParams,
      options
    ).catch((err) => console.error(err));
    const loopTokensMetadata = await tokensMetadataResponse.json();

    // Get the best bid for tokens in the collection
    const tokensBestBidResponse = await fetch(
      "https://api.modulenft.xyz/api/v1/opensea/token/batchBestBid?tokenQuery=" +
        getBestBidParams,
      options
    ).catch((err) => console.error(err));
    const loopTokensBestBid = await tokensBestBidResponse.json();

    // Add loop tokens to the token info arrays
    for (
      let index = assetsPerLoop * loop;
      index < assetsPerLoop * (loop + 1);
      index++
    ) {
      const tokenID = tokenIDs[index];
      var priceInfo;
      if (loopTokensBestBid instanceof Array) {
        priceInfo = loopTokensBestBid.find(
          (element) => element.tokenId == tokenID
        ).info;
      }
      tokensInfo.push({
        traits: loopTokensMetadata.metadata[tokenID]
          ? loopTokensMetadata.metadata[tokenID].attributes
          : null,
        price:
          priceInfo && priceInfo.bestBid ? priceInfo.bestBid["price"] : null,
      });
    }

    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(loop);
  }

  // Write result to file
  fs.writeFileSync("result.json", JSON.stringify(tokensInfo), function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("Hello World > helloworld.txt");
  });

  console.log("Got " + tokensInfo.length + " tokens.");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
