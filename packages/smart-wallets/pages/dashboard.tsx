import { useFundWallet, usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { encodeFunctionData, erc721Abi, erc20Abi, createPublicClient, http, getAddress } from "viem";
import { baseSepolia } from "viem/chains";
import { memberApi } from "../api/member";
import { transactionApi } from "../api/transaction";
import TokenTransferContract from '../public/abi/TokenTransfer.json'
import TokenLinkContract from '../public/abi/TokenLink.json'
import { API, BlockChainNetwork, BlockChainPlatform, TransactionCategory, TransactionType } from "../api/api";
import { paylinkApi } from "../api/paylink";
import { infrastructureApi } from "../api/infrastructure.api";

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();
  const {fundWallet} = useFundWallet();
  const { client: smartWalletClient } = useSmartWallets();
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string>("");
  const [smartWalletBalance, setSmartWalletBalance] = useState<string>("");
  const [fundAmount, setFundAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [members, setMembers] = useState<API.Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<number>();
  const [transferAmount, setTransferAmount] = useState<number>();
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [showPayLinkModal, setShowPayLinkModal] = useState(false);
  const [transactionId, setTransactionId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<number>();
  const [showPayLinkWithdrawModal, setShowPayLinkWithdrawModal] = useState(false);
  const [transactionCode, setTransactionCode] = useState<string>("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

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
      setError("Failed to load member list");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // 弹窗打开时自动加载会员列表
  useEffect(() => {
    if (showTransferModal) {
      loadMembers();
    }
  }, [showTransferModal]);

  // 查看外部钱包和smartWallet钱包的USDC余额
  const onViewUSDCBalance = () => {
    if (!user?.wallet?.address || !user?.smartWallet?.address) {
      setError("Wallet addresses not found");
      return;
    }
    setShowBalanceModal(true);
    fetchBalances(user.wallet.address, user.smartWallet.address);
  };

  // 刷新外部钱包和smartWallet钱包的USDC余额
  const fetchBalances = async (externalAddress: string, smartAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 调用USDC的balanceOf方法，查看外部钱包和smartWallet钱包的USDC余额
      const [externalBalance, smartBalance] = await Promise.all([
        publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [getAddress(externalAddress)]
        }),
        publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [getAddress(smartAddress)]
        })
      ]);

      setUsdcBalance((Number(externalBalance) / 1e6).toString());
      setSmartWalletBalance((Number(smartBalance) / 1e6).toString());
    } catch (err) {
      console.error("Balance fetch failed:", err);
      setError("Failed to fetch balances");
    } finally {
      setIsLoading(false);
    }
  };

  // 从外部钱包存入USDC到smartWallet钱包
  const onFund = () => {
    if (!user?.wallet?.address || !user?.smartWallet?.address) {
      setError("Wallet addresses not found");
      return;
    }
    if (!fundAmount || isNaN(Number(fundAmount))) {
      throw new Error("Invalid amount");
    }
    if (Number(fundAmount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (Number(fundAmount) > Number(usdcBalance)) {
      setError("Insufficient balance");
      return;
    }

    setIsFunding(true);

    // 调用Privy的fundWallet方法，将外部钱包的USDC存入smartWallet钱包
    fundWallet(user.smartWallet.address, {
      chain: baseSepolia,
      asset: {erc20: USDC_ADDRESS},
      amount: fundAmount
    }).finally(() => {
      fetchBalances(user.wallet.address, user.smartWallet.address);
      setIsFunding(false)});
      setFundAmount("");
  };

  // 从smartWallet钱包提款到外部钱包
  const onWithdraw = async () => {
    try {
      if (!smartWalletClient || !user?.wallet?.address) {
        setError("Wallet client not initialized");
        return;
      }
      
      const amount = Number(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        setError("Invalid withdraw amount");
        return;
      }
      if (amount > Number(smartWalletBalance)) {
        setError("Insufficient smart wallet balance");
        return;
      }

      setIsWithdrawing(true);
      setError(null);

      // USDC转账需要精确到6位小数
      const amountInWei = BigInt(amount * 1e6);

      // 调用USDC的transfer方法，将smartWallet钱包的USDC转给外部钱包
      await smartWalletClient.sendTransaction({
        to: USDC_ADDRESS,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [getAddress(user.wallet.address), amountInWei]
        })
      });

      // 刷新余额
      fetchBalances(user.wallet.address, user.smartWallet!.address);
      setWithdrawAmount("");

    } catch (err) {
      console.error("Withdraw failed:", err);
      setError("Withdraw transaction failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // 转账USDC给指定用户
  const handleTransfer = async () => {
    if (!smartWalletClient) return;
    if (!selectedMember || !transferAmount) {
      setError("Please select member and enter amount");
      return;
    }

    // 将 transferAmount 转换为 USDC 精度（乘以 10 的 6 次方）
    const amountInUsdc = transferAmount * 1e6;

    // 调用接口创建交易历史记录，接口返回代币合约地址，业务合约地址，收款人钱包地址
    const {data: transaction} = await transactionApi
      .createTransactionHistory({
        platform: BlockChainPlatform.ETH,
        chainId: selectedChain,
        tokenSymbol: "USDC",
        transactionCategory: TransactionCategory.SEND,
        transactionType: TransactionType.SEND,
        receiverMemberId: selectedMember,
        amount: amountInUsdc,
        message: `Transfer to: ${selectedMember} Amount: ${transferAmount} USDC`,
      });

    // USDC代币合约地址
    const tokenContractAddress = getAddress(transaction.tokenContractAddress!);
    // 转账业务合约地址
    const bizContractAddress = getAddress(transaction.bizContractAddress);
    // 转账金额
    const amount = BigInt(amountInUsdc)

    // 使用Privy的SmartWallet发起ERC4337标准的批量打包交易，保证代币授权和业务合约调用在同一笔交易中执行，并由payMaster代支付网络费用
    const transactionHash = await smartWalletClient.sendTransaction({
      calls:[
        { // 调用USDC代币的approve方法，授信给转账业务合约
          to: tokenContractAddress,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [getAddress(bizContractAddress), amount]
          })
        },
        { // 调用转账业务合约的transfer方法，将代币转给接收方（并收取手续费）
          to: bizContractAddress,
          data: encodeFunctionData({
            abi: TokenTransferContract.abi,
            functionName: "transfer",
            args: [transaction.receiverWalletAddress!, tokenContractAddress, amount]
          })
        }
      ]
    });

    // 更新交易记录的交易哈希字段
    await transactionApi.updateTransactionHash({
      id: transaction.id,
      transactionHash
    });

    setShowTransferModal(false);
  };

  // 创建PayLink存入USDC
  const handleDeposit = async () => {
    if (!smartWalletClient || !depositAmount) {
      setError("Invalid parameters");
      return;
    }

    try {
      // 1. 创建交易记录
      const { data: transaction } = await transactionApi.createTransactionHistory({
        platform: BlockChainPlatform.ETH,
        chainId: selectedChain,
        tokenSymbol: "USDC",
        transactionCategory: TransactionCategory.SEND,
        transactionType: TransactionType.PAY_LINK,
        amount: depositAmount * 1e6,
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

      // 3. 执行智能合约调用
      const amountInUsdc = BigInt(depositAmount * 1e6);
      const transactionHash = await smartWalletClient.sendTransaction({
        calls: [
          {
            // 调用USDC代币的approve方法，授信给PayLink业务合约
            to: tokenContractAddress,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [bizContractAddress, amountInUsdc]
            })
          },
          {
            // 调用PayLink业务合约的deposit方法，存入USDC（并收取手续费）
            to: bizContractAddress,
            data: encodeFunctionData({
              abi: TokenLinkContract.abi,
              functionName: "deposit",
              args: [tokenContractAddress, amountInUsdc, payLink.otp]
            })
          }
        ]
      });

      // 4. 更新交易哈希
      await transactionApi.updateTransactionHash({
        id: transaction.id,
        transactionHash
      });

      setTransactionId(String(transaction.transactionCode))
    } catch (err) {
      console.error("Deposit failed:", err);
      setError("Deposit transaction failed");
    }
  };

  // 从PayLink中获取USDC
  const handleWithdraw = async () => {
    try {
      if (!smartWalletClient || !transactionCode) {
        setError("Invalid parameters");
        return;
      }

      setIsWithdrawing(true);

      // 1. 查询支付链接信息
      const { data: payLink } = await paylinkApi.findPayLink({
        transactionCode,
      });

      // 2. 执行合约调用
      const transactionHash = await smartWalletClient.sendTransaction({
        calls: [
          {
            // 调用PayLink业务合约的withdraw方法，将先前存入的USDC转给调用合约的用户
            to: getAddress(payLink.bizContractAddress),
            data: encodeFunctionData({
              abi: TokenLinkContract.abi,
              functionName: "withdraw",
              args: [
                getAddress(payLink.senderWalletAddress),
                payLink.otp
              ]
            })
          }
        ]
      });

      // 3. 更新交易哈希
      await paylinkApi.updatePayLinkTransactionHash({
        transactionCode,
        transactionHash
      });

      // 4. 重置状态
      setShowPayLinkWithdrawModal(false);
      setTransactionCode("");
      
    } catch (err) {
      console.error("Withdraw failed:", err);
      if (err.response?.data?.message) {
        setError(`Withdraw failed: ${err.response.data.message}`);
      } else {
        setError("Withdraw transaction failed. Please check console for details.");
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  // 新增状态管理
  const [platform, setPlatform] = useState<BlockChainPlatform>(BlockChainPlatform.ETH);
  const [network, setNetwork] = useState<BlockChainNetwork>(BlockChainNetwork.TEST);
  const [chains, setChains] = useState<API.BlockChain[]>([]);
  const [selectedChain, setSelectedChain] = useState<number>(84532); // 默认chainId

  // 新增数据加载逻辑
  useEffect(() => {
    const loadChains = async () => {
      try {
        const response = await infrastructureApi.listBlockChain({
          platform,
          network
        });
        setChains(response.data);
        
        // 设置默认选中chain
        const defaultChain = response.data.find(c => c.chainId === 84532);
        if (defaultChain) {
          setSelectedChain(defaultChain.chainId);
        }
      } catch (err) {
        console.error("Failed to load chains:", err);
        setError("Failed to load blockchain list");
      }
    };

    loadChains();
  }, [platform, network]);

  return (
    <>
      <Head>
        <title>Privy Smart Wallets Demo</title>
      </Head>

      <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
        {ready && authenticated && smartWalletClient ? (
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
              <button
                onClick={onViewUSDCBalance}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                View USDC Balance
              </button>
              <button
                onClick={() => setShowTransferModal(true)}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Token Transfer
              </button>
              <button
                onClick={() => setShowPayLinkModal(true)}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Pay Link Deposit
              </button>
              <button
                onClick={() => setShowPayLinkWithdrawModal(true)}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Pay Link Withdraw
              </button>

              {/* 区块链选择器 */}
              <div className="flex gap-4 items-center bg-white p-2 rounded-md">
                {/* Platform 下拉 */}
                <select 
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as BlockChainPlatform)}
                  className="px-3 py-2 border rounded-md"
                >
                  {Object.values(BlockChainPlatform).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                {/* Network 下拉 */}
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value as BlockChainNetwork)}
                  className="px-3 py-2 border rounded-md"
                >
                  {Object.values(BlockChainNetwork).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>

                {/* Chain 下拉 */}
                <select
                  value={selectedChain}
                  onChange={(e) => setSelectedChain(Number(e.target.value))}
                  className="px-3 py-2 border rounded-md"
                  disabled={!chains.length}
                >
                  {chains.map(chain => (
                    <option key={chain.id} value={chain.chainId}>
                      {chain.name} ({chain.chainId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              User object
            </p>
            <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
              {JSON.stringify(user, null, 2)}
            </pre>
          </>
        ) : null}

        {showBalanceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">USDC Balance</h3>
                <button
                  onClick={() => setShowBalanceModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              {isLoading ? (
                <div className="text-center">Loading...</div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
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

        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Transfer USDC</h3>
                <button
                  onClick={() => setShowTransferModal(false)}
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
                      onChange={(e) => setTransferAmount(e.target.value)}
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

        {showPayLinkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Pay Link Deposit</h3>
                <button
                  onClick={() => setShowPayLinkModal(false)}
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

        {showPayLinkWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Pay Link Withdraw</h3>
                <button
                  onClick={() => {
                    setShowPayLinkWithdrawModal(false);
                    setTransactionCode("");
                    setError(null);
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
      </main>
    </>
  );
}