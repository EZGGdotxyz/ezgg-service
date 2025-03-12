// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./FeeRequired.sol";
import "./FeeMaster.sol";
import "./TokenPayable.sol";

contract TokenTransfer is Ownable, TokenPayable, FeeRequired {
    event TransferEvent(
        string indexed txCode,
        uint256 time,
        address from,
        address to,
        address erc20,
        uint amount
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
     * （需要ERC20预授信）支付合约手续费
     *
     * @param txCode 应用服务端生成的交易代码
     * @param erc20 ERC20代币合约
     * @param amount 支付金额
     */
    function payFee(
        string calldata txCode,
        IERC20 erc20,
        uint amount
    ) public onlyAllowance(erc20, amount) feeCollector(txCode, erc20, amount) {
        _transferFrom(msg.sender, feeReceiver(), erc20, amount);
    }

    /**
     *
     *（需要ERC20预授信）向指定地址发送代币，需要先调用payFee支付手续费
     *
     * @param txCode 应用服务端生成的交易代码
     * @param to 收款人钱包地址
     * @param erc20 ERC20代币合约
     * @param amount 转账金额
     */
    function transfer(
        string calldata txCode,
        address to,
        IERC20 erc20,
        uint amount
    ) public onlyAllowance(erc20, amount) transactional(txCode) {
        _transferFrom(msg.sender, to, erc20, amount);

        emit TransferEvent(
            txCode,
            block.timestamp,
            msg.sender,
            to,
            address(erc20),
            amount
        );
    }
}
