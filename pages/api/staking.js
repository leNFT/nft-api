import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import { BigNumber, utils } from "ethers";
import { Network, Alchemy } from "alchemy-sdk";
import contractAddresses from "../../contractAddresses.json";
const SECONDS_IN_YEAR = 31556926;

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

  const alchemySettings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: chainId == 1 ? Network.ETH_MAINNET : Network.ETH_GOERLI,
  };
  const alchemy = new Alchemy(alchemySettings);

  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["1"];

  var stakingDetails = {};

  const getStakingRewardsFunctionSig = "0x986768b2";
  const getStakingRewardsPeriodFunctionSig = "0xec9fedb4";
  const totalAssetsFunctionSig = "0x01e1d114";

  // Get the Rewards
  const rewardsResponse = await alchemy.core.call({
    to: addresses.NativeTokenVault,
    data: getStakingRewardsFunctionSig,
  });
  console.log("rewardsResponse", rewardsResponse);

  // Get the rewards period
  const rewardsPeriodResponse = await alchemy.core.call({
    to: addresses.NativeTokenVault,
    data: getStakingRewardsPeriodFunctionSig,
  });
  console.log("rewardsPeriodResponse", rewardsPeriodResponse);

  // Get the rewards period
  const vaultBalanceResponse = await alchemy.core.call({
    to: addresses.NativeTokenVault,
    data: totalAssetsFunctionSig,
  });
  console.log("vaultBalanceResponse", vaultBalanceResponse);

  // Calculate and add APY and APR to response
  var stakingAPR = 0;
  if (!BigNumber.from(vaultBalanceResponse).eq(0)) {
    stakingAPR = BigNumber.from(rewardsResponse)
      .div(rewardsPeriodResponse)
      .mul(SECONDS_IN_YEAR)
      .div(vaultBalanceResponse)
      .mul(100)
      .toNumber();
  }
  stakingDetails.apr = stakingAPR;
  stakingDetails.rewards = BigNumber.from(rewardsResponse).toString();
  stakingDetails.vaultBalance = BigNumber.from(vaultBalanceResponse).toString();

  res.status(200).json(stakingDetails);
}
