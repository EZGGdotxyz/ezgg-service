import Head from "next/head";
import { useEffect, useState } from "react";
import { ConnectedWallet, useFundWallet, usePrivy, User, useWallets } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { API, BlockChainNetwork, BlockChainPlatform, BlockChainSmartWalletType, TransactionCategory, TransactionType } from "../api/api"
import { infrastructureApi } from "../api/infrastructure.api";
import { memberApi } from "../api/member";
import { transactionApi } from "../api/transaction";
import { paylinkApi } from "../api/paylink";
import {
  base,
  baseSepolia,
  polygon,
  polygonAmoy,
  bsc,
  bscTestnet,
  arbitrum,
  arbitrumSepolia,
  monadTestnet,
  scroll,
  scrollSepolia,
} from "viem/chains";
import { encodeFunctionData, erc20Abi, createPublicClient, http, getAddress, Chain, Hex } from "viem";
import { createBicoPaymasterClient, createSmartAccountClient, NexusClient, toNexusAccount } from "@biconomy/abstractjs";
import {createWalletClient, custom} from 'viem';
import TokenTransferContract from '../public/abi/TokenTransfer.json'
import TokenLinkContract from '../public/abi/TokenLink.json'

const chains: Chain[] = [
  base,
  baseSepolia,
  polygon,
  polygonAmoy,
  bsc,
  bscTestnet,
  arbitrum,
  arbitrumSepolia,
  monadTestnet,
  scroll,
  scrollSepolia,
];

interface Erc20Info {
  address: string;
  decimals: number;
}

const USDC_ADDRESS: Map<number, Erc20Info> = new Map()
// baseSepolia
USDC_ADDRESS.set(84532, {
  address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  decimals: 1e6,
});
// polygonAmoy
USDC_ADDRESS.set(80002, {
  address: "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
  decimals: 1e6,
});
// bscTestnet
USDC_ADDRESS.set(97, {
  address: "0x64544969ed7EBf5f083679233325356EbE738930",
  decimals: 1e18,
});
// arbitrumSepolia
USDC_ADDRESS.set(421614, {
  address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  decimals: 1e6,
});
// monadTestnet
USDC_ADDRESS.set(10143, {
  address: "0x0",
  decimals: 1e6,
});
// scrollSepolia
USDC_ADDRESS.set(534351, {
  address: "0x7878290DB8C4f02bd06E0E249617871c19508bE6",
  decimals: 1e6,
});

const bundlerUrl = (chainId: number) => {
  switch (chainId) {
    case 97:
      return `https://bundler.biconomy.io/api/v3/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`
    case 534351:
      return `https://bundler.biconomy.io/api/v2/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`
    default:
      return `https://bundler.biconomy.io/api/v3/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`
  }
}
const paymasterUrl = (chainId: number) => {
  switch (chainId) {
    case 97:
      return `https://paymaster.biconomy.io/api/v2/${chainId}/9Yzu5pN8q.f2b8eeaa-1320-44d5-ad12-9bf5c2cdc189`
    case 534351:
      return `https://paymaster.biconomy.io/api/v2/${chainId}/XXTqovaTm.2a644550-a89b-470b-9f95-bedf7a3fb197`
    default:
      return `https://paymaster.biconomy.io/api/v2/${chainId}/9Yzu5pN8q.f2b8eeaa-1320-44d5-ad12-9bf5c2cdc189`
  }
}

const getNexusClient = async (embeddedWallet: ConnectedWallet, chainId: number) => {
  const chain = chains.find((x) => x.id == chainId);
  // 获取 Ethers.js 的 Signer
  const provider = await embeddedWallet.getEthereumProvider();
  const walletClient = createWalletClient({
    account: embeddedWallet.address as Hex,
    chain,
    transport: custom(provider),
  });
  // 初始化智能钱包客户端
  const nexusClient = createSmartAccountClient({ 
      account: await toNexusAccount({
          signer: walletClient, 
          chain: chain!,
          transport: http(),
      }),
      // Bundler API地址，从Biconomy控制面板获取
      transport: http(bundlerUrl(chainId)),
      // Paymaster API地址，从Biconomy控制面板获取
      paymaster: createBicoPaymasterClient({paymasterUrl: paymasterUrl(chainId)})
  });

  return nexusClient;
}

const syncSmartWalletAddress = async (platform: BlockChainPlatform.ETH, embeddedWallet: ConnectedWallet) => {

  const requestBody: API.UpdateMemberSmartWalletInput = {
    smartWallet: []
  }
  const {data} = await infrastructureApi.listBlockChain({ platform });
  const blockChains = data.filter(x => x.smartWalletType === BlockChainSmartWalletType.BICONOMY);
  for (const { chainId } of blockChains) {
    const nexusClient = await getNexusClient(embeddedWallet, chainId);
    requestBody.smartWallet.push({
      platform,
      chainId,
      address: nexusClient.account.address
    });
  }

  if (requestBody.smartWallet.length > 0) {
    await memberApi.updateMemberSmartWallet({
      smartWallet: requestBody.smartWallet
    });
  }
}

export default function DashboardPage2() {

  const { ready, authenticated, user, logout } = usePrivy();
  const [ currentChainId, setCurrentChainId] = useState<number>(84532); // 默认为 baseSepolia
  const onChange = (chainId: number) => {
    setCurrentChainId(chainId);
  }

  const [nexusClient, setNexusClient] = useState<NexusClient | null>(null);
  const { wallets } = useWallets();
  useEffect(() => {
    // 同步当前用户基于BICONOMY的智能钱包地址
    const embeddedWallet = wallets.find((wallet) => (wallet.walletClientType === 'privy'));
    if (embeddedWallet) {
      syncSmartWalletAddress(BlockChainPlatform.ETH, embeddedWallet);
    }
  }, [wallets]);
  
  useEffect(() => {
    // 创建当前链的基于BICONOMY的智能钱包客户端
    const embeddedWallet = wallets.find((wallet) => (wallet.walletClientType === 'privy'));
    if (embeddedWallet) {
        getNexusClient(embeddedWallet, currentChainId)
          .then(nexusClient => {
            setNexusClient(nexusClient);
            console.log("NexusClient:", nexusClient.account.address);
          })
    }
  }, [wallets, currentChainId]);

  return (
    <>
      <Head>
        <title>Privy Smart Wallets Demo</title>
      </Head>
      <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
        {ready && authenticated ? (
        <>
          <div className="flex flex-row justify-between">
            <h1 className="text-2xl font-semibold">
              Privy Smart Wallets Demo
            </h1>
            <button
              onClick={logout}
              className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
            >
              Logout
            </button>
          </div>
          <div className="mt-12 flex gap-4 flex-wrap">
            <ChainSelector defaultId={currentChainId} onChange={onChange}></ChainSelector>
            <Balance chainId={currentChainId} nexusClient={nexusClient} user={user}></Balance>
            <TokenTransfer chainId={currentChainId} nexusClient={nexusClient}></TokenTransfer>
            <PayLinkDeposit chainId={currentChainId} nexusClient={nexusClient}></PayLinkDeposit>
            <PayLinkWithdraw chainId={currentChainId} nexusClient={nexusClient}></PayLinkWithdraw>
            {/* <NexusClientTest chainId={currentChainId} nexusClient={nexusClient}></NexusClientTest> */}
          </div>
          <p className="mt-6 font-bold uppercase text-sm text-gray-600">
            User object
          </p>
          <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
            {JSON.stringify(user, null, 2)}
          </pre>
        </>
      ) : null}
    </main>
    </>
  )
}

function ChainSelector({defaultId, onChange}:{defaultId: number, onChange: (chainId: number) => void}) {

  const [selectedChain, setSelectedChain] = useState<string>(String(defaultId));
  const [blockChains, setBlockChains] = useState<API.BlockChain[]>([]);
  const loadChains = async () => {
    try {
      const response = await infrastructureApi.listBlockChain({
        platform: BlockChainPlatform.ETH,
        network: BlockChainNetwork.TEST
      });
      setBlockChains(response.data);

    } catch (err) {
      console.error("Failed to load chains:", err);
    }
  };
  useEffect(() => {
    loadChains();
  }, []);

  return (
    <>
      <div className="flex gap-4 items-center bg-white p-2 rounded-md">
        {/* Chain 下拉 */}
        <select
          value={selectedChain}
          onChange={(e) => {
            setSelectedChain(e.target.value)
            onChange(Number(e.target.value))
          }}
          className="px-3 py-2 border rounded-md"
          disabled={!chains.length}
        >
          {blockChains.map(chain => (
            <option key={chain.id} value={chain.chainId}>
              {chain.name} ({chain.chainId})
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

function Balance({chainId, nexusClient, user}:{chainId: number, nexusClient: NexusClient|null; user: User|null}) {
  const platform = BlockChainPlatform.ETH;
  const {fundWallet} = useFundWallet();
  const [showModal, setShowModal] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string>("");
  const [smartWalletBalance, setSmartWalletBalance] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const {getClientForChain} = useSmartWallets();
  const [ smartWalletAddress, setSmartWalletAddress ] = useState("");

  useEffect(() => {
    if (user) {
      memberApi.findSmartWalletAddress({
        platform,
        chainId,
        did: user.id
      }).then(({ data }) => setSmartWalletAddress(data) )
    }
  }, [chainId, user]);

  useEffect(() => {
    if (user && smartWalletAddress) {
      fetchBalances();
    }
  }, [showModal, chainId, user, smartWalletAddress]);

  // 刷新外部钱包和smartWallet钱包的USDC余额
  const fetchBalances = async () => {
    try {
      if (!user) {
        console.error("User is null")
        return;
      }
      if (!smartWalletAddress) {
        console.error("Smart wallet address not found")
        return;
      }

      setIsLoading(true);
      const chain = chains.find((x) => x.id == chainId);
      const publicClient = createPublicClient({
        chain,
        transport: http()
      });
      
      // 调用USDC的balanceOf方法，查看外部钱包和smartWallet钱包的USDC余额
      const [externalBalance, smartBalance] = await Promise.all([
        publicClient.readContract({
          address: getAddress(USDC_ADDRESS.get(chainId!)?.address!),
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [getAddress(user.wallet?.address!)]
        }),
        publicClient.readContract({
          address: getAddress(USDC_ADDRESS.get(chainId!)?.address!),
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [getAddress(smartWalletAddress)]
        })
      ]);

      setUsdcBalance((Number(externalBalance) / USDC_ADDRESS.get(chainId!)?.decimals!).toString());
      setSmartWalletBalance((Number(smartBalance) / USDC_ADDRESS.get(chainId!)?.decimals!).toString());
    } catch (err) {
      console.error("Balance fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 从外部钱包存入USDC到smartWallet钱包
  const onFund = () => {
    if (!fundAmount || isNaN(Number(fundAmount))) {
      console.error("Invalid amount");
      throw new Error("Invalid amount");
    }
    if (Number(fundAmount) <= 0) {
      console.error("Amount must be greater than 0");
      return;
    }
    if (Number(fundAmount) > Number(usdcBalance)) {
      console.error("Insufficient balance");
      return;
    }
    if (!user) {
      console.error("User is null")
      return;
    }
    if (!smartWalletAddress) {
      throw new Error("Smart wallet address not found");
    }

    setIsFunding(true);
    const chain = chains.find((x) => x.id == chainId);

    // 调用Privy的fundWallet方法，将外部钱包的USDC存入smartWallet钱包
    fundWallet(smartWalletAddress, {
      chain,
      asset: {erc20: getAddress(USDC_ADDRESS.get(chainId!)?.address!)},
      amount: fundAmount
    }).finally(() => {
      fetchBalances();
      setIsFunding(false)});
      setFundAmount("");

  };

  // 从smartWallet钱包提款到外部钱包
  const onWithdraw = async () => {
    try {      
      const amount = Number(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        console.error("Invalid withdraw amount")
        return;
      }
      if (amount > Number(smartWalletBalance)) {
        console.error("Insufficient smart wallet balance")
        return;
      }
      if (!user) {
        console.error("User is null")
        return;
      }
      if (!smartWalletAddress) {
        throw new Error("Smart wallet address not found");
      }

      setIsWithdrawing(true);
      const smartWalletClient = await getClientForChain({
          id: chainId!,
      }); 

      // USDC转账需要精确到6位小数
      const amountInWei = BigInt(amount * USDC_ADDRESS.get(chainId!)?.decimals!);

      // 调用USDC的transfer方法，将smartWallet钱包的USDC转给外部钱包
      if (chainId === 97 || chainId === 534351) {
        const hash = await nexusClient!.sendUserOperation({
          calls: [
            {
              to: getAddress(USDC_ADDRESS.get(chainId!)?.address!),
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: "transfer",
                args: [getAddress(user.wallet?.address!), amountInWei]
              })
            }
          ]
        });
        await nexusClient?.waitForConfirmedUserOperationReceipt({hash})
      } else {
        await smartWalletClient!.sendTransaction({
          to: getAddress(USDC_ADDRESS.get(chainId!)?.address!),
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [getAddress(user.wallet?.address!), amountInWei]
          })
        });
      }

      // 刷新余额
      fetchBalances();
      setWithdrawAmount("");

    } catch (err) {
      console.error("Withdraw failed:", err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (<>
    <button
      onClick={() => setShowModal(true)}
      className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
    >
      View USDC Balance
    </button>

    {showModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">USDC Balance</h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                External Wallet Balance
              </label>
              <input
                value={usdcBalance}
                readOnly
                className="w-full px-3 py-2 border rounded-md bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Smart Wallet Balance
              </label>
              <input
                value={smartWalletBalance}
                readOnly
                className="w-full px-3 py-2 border rounded-md bg-gray-100"
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="Enter amount"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={onFund}
                  disabled={isFunding}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isFunding ? "Funding..." : "Fund"}
                </button>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="Withdraw amount"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={onWithdraw}
                  disabled={isWithdrawing}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                >
                  {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )}
  </>)
}

function TokenTransfer({chainId, nexusClient}:{chainId: number, nexusClient: NexusClient|null}) {

  const [showModal, setShowModal] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<number>();
  const [members, setMembers] = useState<API.Member[]>([]);
  const [transferAmount, setTransferAmount] = useState<number>();
  const {getClientForChain} = useSmartWallets();

  // 加载会员列表
  const loadMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const response = await memberApi.pageMember({
        page: 1,
        pageSize: 50
      });
      setMembers(response.data.record);
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // 弹窗打开时自动加载会员列表
  useEffect(() => {
    if (showModal) {
      loadMembers();
    }
  }, [showModal]);

  const handleTransfer = async () => {
    if (!selectedMember || !transferAmount) {
      console.error("Please select member and enter amount");
      return;
    }

    const smartWalletClient = await getClientForChain({
        id: chainId,
    }); 
    if (!smartWalletClient) {
      console.error("smartWalletClient not exit chainId:"+chainId);
      return
    };

    // 将 transferAmount 转换为 USDC 精度（乘以 10 的 6 次方）
    const amountInUsdc = transferAmount * USDC_ADDRESS.get(chainId!)?.decimals!;

    // 调用接口创建交易历史记录，接口返回代币合约地址，业务合约地址，收款人钱包地址
    const {data: transaction} = await transactionApi
      .createTransactionHistory({
        platform: BlockChainPlatform.ETH,
        chainId: chainId!,
        tokenContractAddress: getAddress(USDC_ADDRESS.get(chainId)?.address!),
        transactionCategory: TransactionCategory.SEND,
        transactionType: TransactionType.SEND,
        receiverMemberId: selectedMember,
        amount: String(amountInUsdc),
        message: `Transfer to: ${selectedMember} Amount: ${transferAmount} USDC`,
      });

    // USDC代币合约地址
    const tokenContractAddress = getAddress(transaction.tokenContractAddress!);
    // 转账业务合约地址
    const bizContractAddress = getAddress(transaction.bizContractAddress);
    // 转账金额
    const amount = BigInt(amountInUsdc)

    // 获取UserOperation需要消耗的Gas
    // const estimate = await smartWalletClient.estimateUserOperationGas({
    //   calls:[
    //     { // 调用USDC代币的approve方法，授信给转账业务合约
    //       to: tokenContractAddress,
    //       data: encodeFunctionData({
    //         abi: erc20Abi,
    //         functionName: "approve",
    //         args: [getAddress(bizContractAddress), amount]
    //       })
    //     },
    //     { // 调用转账业务合约的transfer方法，将代币转给接收方（并收取手续费）
    //       to: bizContractAddress,
    //       data: encodeFunctionData({
    //         abi: TokenTransferContract.abi,
    //         functionName: "transfer",
    //         args: [transaction.receiverWalletAddress!, tokenContractAddress, amount]
    //       })
    //     }
    //   ],
    //   maxFeePerGas: 0n,
    //   maxPriorityFeePerGas: 0n,
    // })
    // console.log(estimate)

    if (chainId === 97 || chainId === 534351) {

    } else {
      const isAADeployed = await smartWalletClient.account.isDeployed()
      console.log("AA20 Account Deployment:", isAADeployed);
      if(!isAADeployed) {
        const txHash = await smartWalletClient.sendTransaction({
          to: "0x0000000000000000000000000000000000000000", // 发送给 0 地址
          value: 0n, // 0 ETH
          gas: 21000n, // 21000
        });
        console.log("AA20 Account Deployment TX:", txHash);
      }
    }

    const {data: transactionFeeEstimate} = await transactionApi
    .updateNetworkFee({
      transactionCode: transaction.transactionCode,
      tokenContractAddress: transaction.tokenContractAddress!,
    });
    const feeTokenContractAddress = getAddress(transactionFeeEstimate.tokenContractAddress);
    const feeAmount = BigInt(transactionFeeEstimate.totalTokenCost)
   
    const calls = [
      { // 调用USDC代币的approve方法，授信给转账业务合约（转账金额和手续费是同一种代币时，要把金额相加并且只调用一次approve）
        to: tokenContractAddress,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [getAddress(bizContractAddress), amount + feeAmount]
        })
      },
      // 转账金额和手续费不是同种代币时，需要单独为支付手续费的代币approve方法，授信给转账业务合约
      // { 
      //   to: feeTokenContractAddress,
      //   data: encodeFunctionData({
      //     abi: erc20Abi,
      //     functionName: "approve",
      //     args: [getAddress(bizContractAddress), feeAmount]
      //   })
      // },
      { // 先调用转账业务合约的payFee方法，支付手续费
        to: bizContractAddress,
        data: encodeFunctionData({
          abi: TokenTransferContract.abi,
          functionName: "payFee",
          args: [transaction.transactionCode, feeTokenContractAddress, feeAmount]
        })
      },
      { // 调用转账业务合约的transfer方法，将代币转给接收方
        to: bizContractAddress,
        data: encodeFunctionData({
          abi: TokenTransferContract.abi,
          functionName: "transfer",
          args: [transaction.transactionCode, transaction.receiverWalletAddress!, tokenContractAddress, amount]
        })
      }
    ];
    

    // 使用Privy的SmartWallet发起ERC4337标准的批量打包交易，保证代币授权和业务合约调用在同一笔交易中执行，并由payMaster代支付网络费用
    let transactionHash;
    if (chainId === 97 || chainId === 534351) {
      transactionHash = await nexusClient?.sendUserOperation({ calls });
      await nexusClient?.waitForConfirmedUserOperationReceipt({hash: transactionHash!})
    } else {
      transactionHash = await smartWalletClient.sendTransaction({ calls });
    }

    // 更新交易记录的交易哈希字段
    await transactionApi.updateTransactionHash({
      id: transaction.id,
      transactionHash:transactionHash!
    });

    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
      >
        Token Transfer
      </button>
      {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Transfer USDC</h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          {isLoadingMembers ? (
            <div className="text-center">Loading members...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Member
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Choose a member</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {`${member.nickname}(${member.did})` || member.did}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  step="0.01"
                  min="0"
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <button
                onClick={handleTransfer}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Transfer
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}

function PayLinkDeposit({chainId, nexusClient}:{chainId: number, nexusClient: NexusClient|null}) {

  const [showModal, setShowModal] = useState(false);
  const [transactionId, setTransactionId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const {getClientForChain} = useSmartWallets();

  // 创建PayLink存入USDC
  const handleDeposit = async () => {

    const smartWalletClient = await getClientForChain({
        id: chainId,
    }); 
    if (!smartWalletClient) {
      console.error("smartWalletClient not exit chainId:"+chainId);
      return
    };

    try {
      // 1. 创建交易记录
      const { data: transaction } = await transactionApi.createTransactionHistory({
        platform: BlockChainPlatform.ETH,
        chainId: chainId,
        tokenContractAddress: getAddress(USDC_ADDRESS.get(chainId)?.address!),
        transactionCategory: TransactionCategory.SEND,
        transactionType: TransactionType.PAY_LINK,
        amount: String(depositAmount * USDC_ADDRESS.get(chainId!)?.decimals!),
        message: `Pay Link Deposit: ${depositAmount} USDC`,
      });

      // 2. 创建支付链接
      const { data: payLink } = await paylinkApi.createPayLink({
        transactionCode: transaction.transactionCode,
      });

      // USDC代币合约地址
      const tokenContractAddress = getAddress(payLink.tokenContractAddress!);
      // PayLink业务合约地址
      const bizContractAddress = getAddress(payLink.bizContractAddress);

      // 3. 计算手续费
      const {data: transactionFeeEstimate} = await transactionApi
      .updateNetworkFee({
        transactionCode: transaction.transactionCode,
        tokenContractAddress: transaction.tokenContractAddress!,
      });
      const feeTokenContractAddress = getAddress(transactionFeeEstimate.tokenContractAddress);
      const feeAmount = BigInt(transactionFeeEstimate.totalTokenCost)

      // 4. 执行智能合约调用
      const amountInUsdc = BigInt(depositAmount * USDC_ADDRESS.get(chainId!)?.decimals!);

      const calls = [
        {
          // 调用USDC代币的approve方法，授信给PayLink业务合约（转账金额和手续费是同一种代币时，要把金额相加并且只调用一次approve）
          to: tokenContractAddress,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [bizContractAddress, amountInUsdc + feeAmount]
          })
        },
        // 转账金额和手续费不是同种代币时，需要单独为支付手续费的代币approve方法，授信给转账业务合约
        // { 
        //   to: feeTokenContractAddress,
        //   data: encodeFunctionData({
        //     abi: erc20Abi,
        //     functionName: "approve",
        //     args: [getAddress(bizContractAddress), feeAmount]
        //   })
        // },
        { // 先调用转账业务合约的payFee方法，支付手续费
          to: bizContractAddress,
          data: encodeFunctionData({
            abi: TokenLinkContract.abi,
            functionName: "payFee",
            args: [transaction.transactionCode, feeTokenContractAddress, feeAmount]
          })
        },
        {
          // 调用PayLink业务合约的deposit方法，存入USDC（并收取手续费）
          to: bizContractAddress,
          data: encodeFunctionData({
            abi: TokenLinkContract.abi,
            functionName: "deposit",
            args: [transaction.transactionCode, tokenContractAddress, amountInUsdc, payLink.otp]
          })
        }
      ];

      // BSC 和 Scroll 用Biconomy，需要使用nexusClient，不使用Privy的client
      const transactionHash = await ((chainId === 97 || chainId === 534351) 
        ? nexusClient?.sendUserOperation({ calls })
        : smartWalletClient.sendTransaction({ calls }));

      // 4. 更新交易哈希
      await transactionApi.updateTransactionHash({
        id: transaction.id,
        transactionHash:transactionHash!
      });

      setTransactionId(String(transaction.transactionCode))
    } catch (err) {
      console.error("Deposit failed:", err);
    }
  };
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
      >
        Pay Link Deposit
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Pay Link Deposit</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Transaction Code
                </label>
                <input
                  value={transactionId}
                  readOnly
                  className="w-full px-3 py-2 border rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  USDC Amount
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  step="0.01"
                  min="0"
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <button
                onClick={handleDeposit}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PayLinkWithdraw({chainId, nexusClient}:{chainId: number, nexusClient: NexusClient|null}) {
  const [showModal, setShowModal] = useState(false);
  const [transactionCode, setTransactionCode] = useState<string>("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const {getClientForChain} = useSmartWallets();

  // 从PayLink中获取USDC
  const handleWithdraw = async () => {
    const smartWalletClient = await getClientForChain({
        id: chainId,
    }); 
    if (!smartWalletClient) {
      console.error("smartWalletClient not exit chainId:"+chainId);
      return
    };
    try {
      setIsWithdrawing(true);

      // 1. 查询支付链接信息
      const { data: payLink } = await paylinkApi.findPayLink({
        transactionCode,
      });

      const calls = [
        {
          // 调用PayLink业务合约的withdraw方法，将先前存入的USDC转给调用合约的用户
          to: getAddress(payLink.bizContractAddress),
          data: encodeFunctionData({
            abi: TokenLinkContract.abi,
            functionName: "withdraw",
            args: [
              transactionCode,
              getAddress(payLink.senderWalletAddress),
              payLink.otp
            ]
          })
        }
      ];

      // 2. 执行合约调用
      const transactionHash = await ((chainId === 97 || chainId === 534351) // BSC 和 Scroll 用Biconomy，需要使用nexusClient，不使用Privy的client
        ? nexusClient?.sendUserOperation({ calls })
        : smartWalletClient.sendTransaction({ calls }));

      // 3. 更新交易哈希
      await paylinkApi.updatePayLinkTransactionHash({
        transactionCode,
        transactionHash: transactionHash!
      });

      // 4. 重置状态
      setShowModal(false);
      setTransactionCode("");
      
    } catch (err) {
      console.error("Withdraw failed:", err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
      >
        Pay Link Withdraw
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Pay Link Withdraw</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setTransactionCode("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Transaction Code
                </label>
                <input
                  type="string"
                  value={transactionCode}
                  onChange={(e) => setTransactionCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter Transaction Code"
                />
              </div>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {isWithdrawing ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NexusClientTest({chainId, nexusClient}:{chainId: number; nexusClient: NexusClient|null}) {

  const [showModal, setShowModal] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<number>();
  const [members, setMembers] = useState<API.Member[]>([]);
  const [transferAmount, setTransferAmount] = useState<number>();

  // 加载会员列表
  const loadMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const response = await memberApi.pageMember({
        page: 1,
        pageSize: 50
      });
      setMembers(response.data.record);
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // 弹窗打开时自动加载会员列表
  useEffect(() => {
    if (showModal) {
      loadMembers();
    }
  }, [showModal]);

  const onClick = () => {
    setShowModal(true);
  }

  const handleTransfer = async () => {
    if (!nexusClient) {
      console.error("nexusClient not exit");
      return
    }
    if (!transferAmount) {
      console.error("transferAmount not exit");
      return
    }

    const receiver = members.filter(x => x.id === selectedMember)[0];
    const receiverAddress = receiver?.memberLinkedAccount?.filter(x => x.type === "smart_wallet").map(x => x.search)[0]
    if (!receiverAddress) {
      console.error("receiverAddress not exit");
      return
    }

    const amountInUsdc = transferAmount * USDC_ADDRESS.get(chainId!)?.decimals!;

    console.log("NexusClient Smart Account Address:", nexusClient.account.address);

    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: getAddress(USDC_ADDRESS.get(chainId)?.address!),
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [
              getAddress(receiverAddress),
              BigInt(amountInUsdc)
            ]
          })
        }
      ]
    });

    await nexusClient.waitForConfirmedUserOperationReceipt({ hash });
  }

  return (
    <>
      <button
        onClick={onClick}
        className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
      >
        NexusClient Test
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Transfer USDC</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            {isLoadingMembers ? (
              <div className="text-center">Loading members...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Select Member
                  </label>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Choose a member</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {`${member.nickname}(${member.did})` || member.did}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    step="0.01"
                    min="0"
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <button
                  onClick={handleTransfer}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Transfer
                </button>
              </div>
            )}
          </div>
        </div>        
      )}
    </>
  );

}