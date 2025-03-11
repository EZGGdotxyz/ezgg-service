import {
  createPublicClient,
  http,
  erc20Abi,
  encodeAbiParameters,
  keccak256,
  toHex,
  getAddress,
  createClient,
  encodeFunctionData,
} from "viem";
import {
  createBundlerClient,
  toCoinbaseSmartAccount,
} from "viem/account-abstraction";
import { baseSepolia } from "viem/chains";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import TokenTransferContract from "../ignition/deployments/chain-84532/artifacts/TokenTransferModule#TokenTransfer.json";
import SimpleAccount from "@account-abstraction/contracts/artifacts/SimpleAccount.json";

describe("estimateUserOperationGas", async function () {
  async function configure() {
    const [owner] = await hre.viem.getWalletClients();

    const client = createClient({
      chain: baseSepolia,
      transport: http(
        "https://base-sepolia.g.alchemy.com/v2/gPRkgRF2_Rxpg4H8QZIRMy8GKrp2Aq2T"
      ),
    });

    return { client };
  }

  it("Should estimateUserOperationGas", async function () {
    const { client } = await loadFixture(configure);

    const encoded_approve = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: ["0xb5E6435BAD8C89aE1743A6b397FA9AACb32a16b6", 1n],
    });

    const encoded_transfer = encodeFunctionData({
      abi: TokenTransferContract.abi,
      functionName: "transfer",
      args: [
        "0xaF3c7140a24D2a6d893729354B78b37D9aB36703",
        "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        1n,
      ],
    });

    const callData = encodeFunctionData({
      abi: SimpleAccount.abi,
      functionName: "executeBatch",
      args: [
        [
          "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          "0xb5E6435BAD8C89aE1743A6b397FA9AACb32a16b6",
        ],
        [0n, 0n],
        [encoded_approve, encoded_transfer],
      ],
    });

    const gas = await client.request({
      method: "eth_estimateUserOperationGas",
      params: [
        {
          sender: "0x8DCB4c02D46f86Fbc3576EC9C43762d391A99e8e",
          callData,
          nonce: "0x0",
          initCode: "0x",
          callGasLimit: "0x0",
          verificationGasLimit: "0x0",
          preVerificationGas: "0x0",
          maxFeePerGas: "0x0",
          maxPriorityFeePerGas: "0x0",
          paymasterAndData: "0x",
          signature:
            "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
        },
        "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      ],
    });
    console.log(gas);
  });
});
