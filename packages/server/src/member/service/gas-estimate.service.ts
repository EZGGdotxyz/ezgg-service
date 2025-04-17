import { Prisma, TokenContract, TransactionHistory, TransactionType } from "@prisma/client";
import type { AlchemyFactory } from "../../plugins/alchemy.js";
import { Alchemy, BigNumber, Network, Utils } from "alchemy-sdk";
import type { ExtendPrismaClient as PrismaClient } from "../../plugins/prisma.js";
import { PARAMETER_ERROR } from "../../core/error.js";
import { Symbols } from "../../identifier.js";
import { Symbols as Services } from "./identifier.js";
import { inject, injectable } from "inversify";
import { BlockChainService } from "./index.js";
import { nanoid } from "nanoid";
import { Decimal } from "decimal.js";
import {
  Address,
  encodeFunctionData,
  erc20Abi,
  getAddress,
  keccak256,
  toHex,
  parseUnits,
  formatUnits,
} from "viem";
import type { FastifyInstance } from "fastify";
import { ViemClient } from "../../plugins/viem-client.js";
import TokenTransferContractAbi from "../../abi/TokenTransfer.json" with { type: "json" };
import TokenLinkContractAbi from "../../abi/TokenLink.json" with { type: "json" };
import SimpleAccountAbi from "@account-abstraction/contracts/artifacts/SimpleAccount.json" with { type: "json" };

@injectable()
export class GasEstimateService {
  constructor(
    @inject(Symbols.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(Services.BlockChainService)
    private readonly blockChainService: BlockChainService,
    @inject(Symbols.AlchemyFactory)
    private readonly alchemyFactory: AlchemyFactory,
    @inject(Symbols.Fastify)
    private readonly fastify: FastifyInstance
  ) {}

  async estimateNetworkFee({
    trans,
    token
  }: {
    trans: TransactionHistory;
    token: TokenContract;
  }): Promise<Prisma.TransactionFeeEstimateCreateManyInput> {
    const alchemy = await this.getAlchemy({ trans });
    const client = await this.fastify.viem.client(trans.chainId);

    const ethValue = await this.blockChainService.getEthValue({
      platform: trans.platform,
      chainId: trans.chainId,
    });

    const simpleAccountHandler = new SimpleAccountHandler(client);
    const ops = {
      erc20: new UserOperation.Erc20(trans.tokenContractAddress),
      tokenTransfer: new UserOperation.TokenTransfer(trans.bizContractAddress!),
      tokenLink: new UserOperation.TokenLink(trans.bizContractAddress!),
    };
    const calls = [ops.erc20.approve(trans.bizContractAddress!, BigInt(trans.amount))];
    if (trans.transactionType !== TransactionType.PAY_LINK) {
      calls.push(
        ops.tokenTransfer.payFee(
          trans.transactionCode,
          trans.tokenContractAddress!,
          0
        ),
        ops.tokenTransfer.transfer(
          trans.transactionCode,
          trans.receiverWalletAddress!,
          trans.tokenContractAddress!,
          BigInt(trans.amount)
        )
      );
    } else {
      const otp = nanoid(64);
      calls.push(
        ops.tokenLink.payFee(
          trans.transactionCode,
          trans.tokenContractAddress!,
          0
        ),
        ops.tokenLink.deposit(
          trans.transactionCode,
          trans.tokenContractAddress!,
          BigInt(trans.amount),
          hashKeccak256(otp)
        ),
        ops.tokenLink.withdraw(trans.transactionCode, trans.senderWalletAddress!, otp)
      );
    }

    const { preVerificationGas, verificationGasLimit, callGasLimit } = (trans.chainId !== 97 && trans.chainId !== 534351) ?
      await simpleAccountHandler.estimateUserOperationGas({
        sender: getAddress(trans.senderWalletAddress!),
        calls,
      }) : {
        preVerificationGas: "0x0" as `0x${string}`,
        verificationGasLimit: "0x0" as `0x${string}`,
        callGasLimit: "0x0" as `0x${string}`,
      };
    const gasPrice = await alchemy.core.getGasPrice();

    return compute({
      preVerificationGas,
      verificationGasLimit,
      callGasLimit,
      gasPrice,
      trans,
      token,
      ethToUsd: ethValue.tokenPrice!,
      platformFeeScale: this.fastify.config.PLATFORM_FEE_SCALE,
      platformFee: this.fastify.config.PLATFORM_FEE,
    });
  }

  private async getAlchemy({
    trans: { platform, chainId },
  }: {
    trans: TransactionHistory;
  }): Promise<Alchemy> {
    const blockChain = await this.prisma.blockChain.findUnique({
      where: { platform_chainId: { platform, chainId } },
    });
    if (!blockChain) {
      throw PARAMETER_ERROR({ message: "block chain not found" });
    }
    return this.alchemyFactory.get(blockChain.alchemyNetwork as Network);
  }
}

function hashKeccak256(input: string): string {
  return keccak256(toHex(input));
}

function compute({
  preVerificationGas,
  verificationGasLimit,
  callGasLimit,
  gasPrice,
  trans,
  token,
  ethToUsd,
  platformFeeScale,
  platformFee
}: {
  preVerificationGas: `0x${string}`;
  verificationGasLimit: `0x${string}`;
  callGasLimit: `0x${string}`;
  gasPrice: BigNumber;
  trans: TransactionHistory;
  token: TokenContract;
  ethToUsd: string;
  platformFeeScale: string;
  platformFee: string;
}): Prisma.TransactionFeeEstimateCreateManyInput {
  let platformFeeUsd;
  if (trans.tokenFeeSupport) {
    const scale =  new Decimal(platformFeeScale);
    const amountInToken = formatUnits(BigInt(trans.amount), trans.tokenDecimals!)
    const fee = new Decimal(amountInToken).mul(scale).div(100);
    platformFeeUsd = fee.mul(new Decimal(trans.tokenPrice!))
  } else {
    platformFeeUsd =  new Decimal(platformFee);
  }

  const BN = {
    preVerificationGas: BigNumber.from(preVerificationGas),
    verificationGasLimit: BigNumber.from(verificationGasLimit),
    callGasLimit: BigNumber.from(callGasLimit),
  };

  const gas = BN.preVerificationGas
    .add(BN.verificationGasLimit)
    .add(BN.callGasLimit);
  const totalWeiCost = gas.mul(gasPrice);
  const totalEthCost = new Decimal(Utils.formatUnits(totalWeiCost, "ether"));
  const totalUsdCost = totalEthCost.mul(new Decimal(ethToUsd));
  const totalTokenCost = totalUsdCost.plus(platformFeeUsd).div(new Decimal(token.priceValue!));

  const cost = {
    totalWeiCost: totalWeiCost.toString(),
    totalEthCost: totalEthCost.toFixed(),
    totalUsdCost: totalUsdCost.toFixed(),
    platformFee: platformFeeUsd.toFixed(),
    totalTokenCost: parseUnits(totalTokenCost.toFixed(token.tokenDecimals!),token.tokenDecimals!).toString(),
  };

  return {
    transactionHistoryId: trans.id,
    transactionCode: trans.transactionCode,
    platform: trans.platform,
    chainId: trans.chainId,
    tokenSymbol: token.tokenSymbol!,
    tokenDecimals: token.tokenDecimals!,
    tokenContractAddress: token.address,
    tokenPrice: token.priceValue!,
    ethToUsd: ethToUsd,
    preVerificationGas: BN.preVerificationGas.toString(),
    verificationGasLimit: BN.verificationGasLimit.toString(),
    callGasLimit: BN.callGasLimit.toString(),
    gas: gas.toString(),
    gasPrice: gasPrice.toString(),
    ...cost
  };
}

namespace UserOperation {
  export interface Op {
    address: Address;
    value?: bigint;
    callData: `0x${string}`;
  }
  export class Erc20 {
    constructor(private readonly contractAddress: string) {}
    approve(spenderAddress: string, amount: bigint): Op {
      return {
        address: getAddress(this.contractAddress),
        value: 0n,
        callData: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [getAddress(spenderAddress), BigInt(amount)],
        }),
      };
    }
  }

  export class TokenTransfer {
    constructor(private readonly contractAddress: string) {}

    payFee(
      txCode: string,
      tokenContractAddress: string,
      amount: number
    ): Op {
      return {
        address: getAddress(this.contractAddress),
        value: 0n,
        callData: encodeFunctionData({
          abi: TokenTransferContractAbi.abi,
          functionName: "payFee",
          args: [
            txCode,
            getAddress(tokenContractAddress),
            BigInt(amount),
          ],
        }),
      };
    }

    transfer(
      txCode: string,
      receiverWalletAddress: string,
      tokenContractAddress: string,
      amount: bigint
    ): Op {
      return {
        address: getAddress(this.contractAddress),
        value: 0n,
        callData: encodeFunctionData({
          abi: TokenTransferContractAbi.abi,
          functionName: "transfer",
          args: [
            txCode,
            getAddress(receiverWalletAddress),
            getAddress(tokenContractAddress),
            BigInt(amount),
          ],
        }),
      };
    }
  }

  export class TokenLink {
    constructor(private readonly contractAddress: string) {}

    payFee(
      txCode: string,
      tokenContractAddress: string,
      amount: number
    ): Op {
      return {
        address: getAddress(this.contractAddress),
        value: 0n,
        callData: encodeFunctionData({
          abi: TokenTransferContractAbi.abi,
          functionName: "payFee",
          args: [
            txCode,
            getAddress(tokenContractAddress),
            BigInt(amount),
          ],
        }),
      };
    }
    
    deposit(txCode: string,tokenContractAddress: string, amount: bigint, otp: string): Op {
      return {
        address: getAddress(this.contractAddress),
        value: 0n,
        callData: encodeFunctionData({
          abi: TokenLinkContractAbi.abi,
          functionName: "deposit",
          args: [txCode, getAddress(tokenContractAddress), BigInt(amount), otp],
        }),
      };
    }

    withdraw(txCode: string,receiverWalletAddress: string, otp: string): Op {
      return {
        address: getAddress(this.contractAddress),
        value: 0n,
        callData: encodeFunctionData({
          abi: TokenLinkContractAbi.abi,
          functionName: "withdraw",
          args: [txCode,getAddress(receiverWalletAddress), otp],
        }),
      };
    }
  }

  export class SimpleAccount {
    execute(op: Op) {
      return {
        address: `0x0`,
        value: 0n,
        callData: encodeFunctionData({
          abi: SimpleAccountAbi.abi,
          functionName: "execute",
          args: [op.address, op.value, op.callData],
        }),
      };
    }

    executeBatch(ops: Op[]) {
      return {
        address: `0x0`,
        value: 0n,
        callData: encodeFunctionData({
          abi: SimpleAccountAbi.abi,
          functionName: "executeBatch",
          args: [
            ops.map((op) => op.address),
            ops.map((op) => op.value),
            ops.map((op) => op.callData),
          ],
        }),
      };
    }
  }
}

class SimpleAccountHandler {
  private readonly simpleAccount = new UserOperation.SimpleAccount();
  constructor(private readonly client: ViemClient) {}
  async estimateUserOperationGas({
    sender,
    calls,
  }: {
    sender: Address;
    calls: UserOperation.Op[];
  }) {
    const { callData } = this.simpleAccount.executeBatch(calls);
    return await this.client.request({
      method: "eth_estimateUserOperationGas",
      params: [
        {
          sender,
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
  }
}
