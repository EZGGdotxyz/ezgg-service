// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FeeRequired.sol";
import "./FeeMaster.sol";
import "./TokenPayable.sol";

contract TokenVault is Ownable, TokenPayable, FeeRequired, ReentrancyGuard {
    event VaultDeposit(
        uint256 time,
        address from,
        address to,
        address erc20,
        uint amount,
        uint fee
    );

    event VaultWithdraw(
        uint256 time,
        address from,
        address to,
        address erc20,
        uint amount
    );

    // 用户暂存库余额记录
    mapping(address => mapping(address => uint)) tokenBalance;

    constructor(
        address initialOwner,
        FeeMaster feeMaster
    ) Ownable(initialOwner) FeeRequired(feeMaster) {}

    /**
     *
     * （合约拥有人）设置手续费管理合约
     *
     * @param feeMaster 手续费管理合约地址
     */
    function setFeeMaster(FeeMaster feeMaster) public onlyOwner {
        _setFeeMaster(feeMaster);
    }

    /**
     *
     * （需要ERC20预授信）将预授信的ERC20代币存入当前合约
     *
     * @param erc20 ERC20代币合约
     * @param amount 存入金额
     */
    function deposit(IERC20 erc20, uint amount) public receiver(erc20, amount) {
        // 计算并支付手续费
        (uint fee, ) = _collectFee(erc20, amount);
        // 更新代币余额_collectFee
        uint amountWithoutFee = amount - fee;
        tokenBalance[msg.sender][address(erc20)] += amountWithoutFee;

        emit VaultDeposit(
            block.timestamp,
            msg.sender,
            address(this),
            address(erc20),
            amountWithoutFee,
            fee
        );
    }

    /**
     *
     * 从当前合约提取指定数量代币
     *
     * @param erc20 ERC20代币合约地址
     * @param amount 存入金额
     */
    function withdraw(IERC20 erc20, uint amount) public nonReentrant {
        // 检查提款数额是否超过已存入代币余额
        uint deposited = tokenBalance[msg.sender][address(erc20)];
        if (amount > deposited) {
            revert OutOfBalance();
        }
        // 更新代币余额
        tokenBalance[msg.sender][address(erc20)] -= amount;
        // 发起转账
        _transfer(msg.sender, erc20, amount);

        emit VaultWithdraw(
            block.timestamp,
            address(this),
            msg.sender,
            address(erc20),
            amount
        );
    }

    /**
     *
     * 查看当前合约中指定代币的余额
     *
     * @param erc20Address ERC20代币合约地址
     */
    function balance(address erc20Address) public view returns (uint) {
        return tokenBalance[msg.sender][erc20Address];
    }
}
