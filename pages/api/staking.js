import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import { BigNumber, utils } from "ethers";
import { Network, Alchemy } from "alchemy-sdk";

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

  const getRewardsFunctionSig = "0x0572b0cc";
  const getRewardsPeriodFunctionSig = "0xcd155e47";
  const getBalanceFunctionSig = "0xf8b2cb4fs";

  // Get the Rewards
  const rewardsResponse = await alchemy.core.call({
    to: addresses.NativeToken,
    data: getRewardsFunctionSig,
  });
  console.log("rewardsResponse", rewardsResponse);

  // Get the rewards period
  const rewardsPeriodResponse = await alchemy.core.call({
    to: addresses.NativeToken,
    data: getRewardsPeriodFunctionSig,
  });
  console.log("rewardsPeriodResponse", rewardsPeriodResponse);

  // Get the rewards period
  const vaultBalanceResponse = await alchemy.core.call({
    to: addresses.NativeToken,
    data:
      getBalanceFunctionSig +
      utils.defaultAbiCoder
        .encode(["address"], [addresses.NativeTokenVault])
        .substring(2),
  });
  console.log("vaultBalanceResponse", vaultBalanceResponse);

  // Calculate and add APY and APR to response
  var stakingAPR = 0;
  var stakingAPY = 0;
  if (!BigNumber.from(vaultBalanceResponse).eq(0)) {
    const numberOfPeriods = SECONDS_IN_YEAR / rewardsPeriodResponse;
    stakingAPR = BigNumber.from(rewardsResponse)
      .div(rewardsPeriodResponse)
      .mul(SECONDS_IN_YEAR)
      .div(vaultBalanceResponse)
      .mul(10000);
    stakingAPY = (1 + stakingAPR / numberOfPeriods) ^ (numberOfPeriods - 1);
  }
  stakingDetails.apr = stakingAPR;
  stakingDetails.apy = stakingAPY;

  res.status(200).json(stakingDetails);
}
