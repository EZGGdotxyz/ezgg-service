import { task } from "hardhat/config";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  base,
  baseSepolia,
  polygon,
  polygonAmoy,
  bsc,
  bscTestnet,
} from "viem/chains";
import FeeMaster from "../artifacts/contracts/FeeMaster.sol/FeeMaster.json";

const chains = [base, baseSepolia, polygon, polygonAmoy, bsc, bscTestnet];
const getChain = (chainId: number) => chains.find((x) => x.id == chainId);

task("updateFeeMaster")
  .addParam("chainid")
  .addParam("address")
  .addParam("receiver")
  .setAction(async (taskArgs) => {
    const privateKey = `0x${process.env.EGZZ_ONWER_PRIVY_KEY}` as `0x${string}`;
    const chain = getChain(taskArgs.chainid);
    const walletClient = createWalletClient({
      chain,
      account: privateKeyToAccount(privateKey),
      transport: http(),
    });
    const client = walletClient.extend(publicActions);

    const oldReceiver = await client.readContract({
      abi: FeeMaster.abi,
      address: taskArgs.address,
      functionName: "getFeeReceiver",
    });

    const tx = await client.writeContract({
      abi: FeeMaster.abi,
      address: taskArgs.address,
      functionName: "setFeeReceiver",
      args: [taskArgs.receiver],
    });

    console.log(
      `tx:${tx} update feeReceiver from ${oldReceiver} to ${taskArgs.receiver} on ${taskArgs.chainid}`
    );
  });
