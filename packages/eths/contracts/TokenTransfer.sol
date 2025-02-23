// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./FeeRequired.sol";
import "./FeeMaster.sol";
import "./TokenPayable.sol";

contract TokenTransfer is Ownable, TokenPayable, FeeRequired {
    event TransferEvent(
        uint256 time,
        address from,
        address to,
        address erc20,
        uint amount,
        uint fee
    );

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
     *（需要ERC20预授信）向指定地址发送代币
     *
     * @param to 收款人钱包地址
     * @param erc20 ERC20代币合约
     * @param amount 转账金额
     */
    function transfer(
        address to,
        IERC20 erc20,
        uint amount
    ) public onlyAllowance(erc20, amount) {
        // 计算并支付手续费
        (uint fee, ) = _collectFeeFrom(msg.sender, erc20, amount);
        // 发起转账
        uint amountWithoutFee = amount - fee;
        _transferFrom(msg.sender, to, erc20, amountWithoutFee);

        emit TransferEvent(
            block.timestamp,
            msg.sender,
            to,
            address(erc20),
            amountWithoutFee,
            fee
        );
    }
}
