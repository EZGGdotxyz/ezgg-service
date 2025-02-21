// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FeeRequired} from "./FeeRequired.sol";
import {TokenPayable} from "./TokenPayable.sol";

contract TokenVault is Ownable, TokenPayable, FeeRequired {
    // 用户暂存库余额记录
    mapping(address => mapping(address => uint)) tokenBalance;

    constructor(
        address initialOwner,
        address feeMaster
    ) Ownable(initialOwner) FeeRequired(feeMaster) {}

    /**
     *
     * （合约拥有人）设置手续费管理合约
     *
     * @param feeMaster 手续费管理合约地址
     */
    function setFeeMaster(address feeMaster) public onlyOwner {
        _setFeeMaster(feeMaster);
    }

    /**
     *
     * （需要ERC20预授信）将预授信的ERC20代币存入当前合约
     *
     * @param erc20Address ERC20代币合约地址
     * @param amount 存入金额
     */
    function deposit(
        address erc20Address,
        uint amount
    ) public receiver(erc20Address, amount) {
        // 计算并支付手续费
        (uint fee, ) = collectFee(erc20Address, amount);
        // 更新代币余额
        tokenBalance[msg.sender][erc20Address] += amount - fee;
    }

    /**
     *
     * 从当前合约提取指定数量代币
     *
     * @param erc20Address ERC20代币合约地址
     * @param amount 存入金额
     */
    function withdraw(address erc20Address, uint amount) public {
        // 检查提款数额是否超过已存入代币余额
        uint deposited = tokenBalance[msg.sender][erc20Address];
        if (amount > deposited) {
            revert OutOfBalance();
        }
        // 更新代币余额
        tokenBalance[msg.sender][erc20Address] -= amount;
        // 发起转账
        _transfer(msg.sender, erc20Address, amount);
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
