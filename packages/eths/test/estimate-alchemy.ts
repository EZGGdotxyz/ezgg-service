import axios from "axios";
import { erc20Abi } from "viem";
import { ethers } from "ethers";
import TokenTransferContract from "../ignition/deployments/chain-84532/artifacts/TokenTransferModule#TokenTransfer.json";

describe("estimateUserOperationGas", async function () {
  it("Should estimateUserOperationGas", async function () {
    const accountABI = [
      "function execute(address dest, uint256 value, bytes calldata func) external",
      "function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external",
    ];
    const accountContract = new ethers.Interface(accountABI);

    const tokenContract = new ethers.Interface(erc20Abi);
    const encoded_approve = tokenContract.encodeFunctionData("approve", [
      "0xb5E6435BAD8C89aE1743A6b397FA9AACb32a16b6",
      1n,
    ]);
    const transferContract = new ethers.Interface(TokenTransferContract.abi);
    const encoded_transfer = transferContract.encodeFunctionData("transfer", [
      "0xaF3c7140a24D2a6d893729354B78b37D9aB36703",
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      1n,
    ]);

    const callData = accountContract.encodeFunctionData("executeBatch", [
      [
        "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        "0xb5E6435BAD8C89aE1743A6b397FA9AACb32a16b6",
      ],
      [0n, 0n],
      [encoded_approve, encoded_transfer],
    ]);

    try {
      const response = await axios.post(
        "https://base-sepolia.g.alchemy.com/v2/gPRkgRF2_Rxpg4H8QZIRMy8GKrp2Aq2T",
        {
          id: 1,
          jsonrpc: "2.0",
          method: "eth_estimateUserOperationGas",
          params: [
            {
              sender: "0x8DCB4c02D46f86Fbc3576EC9C43762d391A99e8e",
              callData,
              //"0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000036cbd53842c5426634e7929541ec2318f3dcf7e000000000000000000000000b5e6435bad8c89ae1743a6b397fa9aacb32a16b60000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000b5e6435bad8c89ae1743a6b397fa9aacb32a16b60000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000064beabacc8000000000000000000000000af3c7140a24d2a6d893729354b78b37d9ab36703000000000000000000000000036cbd53842c5426634e7929541ec2318f3dcf7e000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000",
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
            {},
          ],
        }
      );
      console.log(response.data);
    } catch (error) {
      console.error(
        "Error estimating user operation:",
        error.response?.data || error.message
      );
      throw error;
    }
  });

  it("Should estimateUserOperationGas", async function () {
    const accountABI = [
      "function execute(address dest, uint256 value, bytes calldata func) external",
      "function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external",
    ];
    const accountContract = new ethers.Interface(accountABI);

    const tokenContract = new ethers.Interface(erc20Abi);
    const encoded_approve = tokenContract.encodeFunctionData("approve", [
      "0xb5E6435BAD8C89aE1743A6b397FA9AACb32a16b6",
      1n,
    ]);
    const transferContract = new ethers.Interface(TokenTransferContract.abi);
    const encoded_transfer = transferContract.encodeFunctionData("transfer", [
      "0xaF3c7140a24D2a6d893729354B78b37D9aB36703",
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      1n,
    ]);

    const callData = accountContract.encodeFunctionData("executeBatch", [
      [
        "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        "0xb5E6435BAD8C89aE1743A6b397FA9AACb32a16b6",
      ],
      [0n, 0n],
      [encoded_approve, encoded_transfer],
    ]);

    try {
      const response = await axios.post(
        "https://base-sepolia.g.alchemy.com/v2/gPRkgRF2_Rxpg4H8QZIRMy8GKrp2Aq2T",
        {
          id: 1,
          jsonrpc: "2.0",
          method: "eth_estimateUserOperationGas",
          params: [
            {
              sender: "0x8DCB4c02D46f86Fbc3576EC9C43762d391A99e8e",
              callData,
              //"0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000036cbd53842c5426634e7929541ec2318f3dcf7e000000000000000000000000b5e6435bad8c89ae1743a6b397fa9aacb32a16b60000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000b5e6435bad8c89ae1743a6b397fa9aacb32a16b60000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000064beabacc8000000000000000000000000af3c7140a24d2a6d893729354b78b37d9ab36703000000000000000000000000036cbd53842c5426634e7929541ec2318f3dcf7e000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000",
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
            {},
          ],
        }
      );
      console.log(response.data);
    } catch (error) {
      console.error(
        "Error estimating user operation:",
        error.response?.data || error.message
      );
      throw error;
    }
  });
});
