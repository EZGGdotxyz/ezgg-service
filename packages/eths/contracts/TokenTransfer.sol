// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FeeRequired} from "./FeeRequired.sol";
import {TokenPayable} from "./TokenPayable.sol";

contract TokenTransfer is Ownable, TokenPayable, FeeRequired {
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
     *（需要ERC20预授信）向指定地址发送代币
     *
     * @param to 收款人钱包地址
     * @param erc20Address ERC20代币合约地址
     * @param amount 转账金额
     */
    function transfer(
        address to,
        address erc20Address,
        uint amount
    ) public onlyAllowance(erc20Address, amount) {
        // 计算并支付手续费
        (uint fee, address feeReceiver) = feeCalculate(erc20Address, amount);
        // 支付手续费
        _transferFrom(msg.sender, feeReceiver, erc20Address, fee);
        // 发起转账
        _transferFrom(msg.sender, to, erc20Address, amount - fee);
    }
}
