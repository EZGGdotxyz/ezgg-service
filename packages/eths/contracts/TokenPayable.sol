// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract TokenPayable {
    using SafeERC20 for IERC20;

    event TokenReceived(
        uint256 time,
        address from,
        address to,
        address erc20Address,
        uint amount
    );

    event TokenTransfer(
        uint256 time,
        address from,
        address to,
        address erc20Address,
        uint amount
    );

    error AllowanceRequire();
    error AmountIncorrect();
    error OutOfBalance();
    error IncorrectReceiveAddress();

    modifier onlyAllowance(IERC20 erc20, uint amount) {
        _checkAllowance(erc20, amount);
        _;
    }

    modifier receiver(IERC20 erc20, uint amount) {
        // 金额不能等于0
        if (amount == 0) {
            revert AmountIncorrect();
        }
        // 检查合约调用方是否已授权ERC20代币额度给当前合约
        _checkAllowance(erc20, amount);
        // 转移授信代币到当前合约中
        _transferFrom(msg.sender, address(this), erc20, amount);
        _;
        emit TokenReceived(
            block.timestamp,
            msg.sender,
            address(this),
            address(erc20),
            amount
        );
    }

    function _checkAllowance(IERC20 erc20, uint amount) internal view {
        uint allowance = erc20.allowance(msg.sender, address(this));
        if (allowance < amount) {
            revert AllowanceRequire();
        }
    }

    modifier transferAudit(
        address from,
        address to,
        IERC20 erc20,
        uint amount
    ) {
        // 检查用户代币余额是否足够支付
        if (erc20.balanceOf(from) < amount) {
            revert OutOfBalance();
        }
        // 检查代表接收地址是否为零地址，防止代表丢失
        if (to == address(0)) {
            revert IncorrectReceiveAddress();
        }
        _;
        emit TokenTransfer(block.timestamp, from, to, address(erc20), amount);
    }

    function _transfer(
        address to,
        IERC20 erc20,
        uint amount
    ) internal transferAudit(address(this), to, erc20, amount) {
        // 使用合约中持有的代币支付给目标钱包
        if (amount > 0) {
            erc20.safeTransfer(to, amount);
        }
    }

    function _transferFrom(
        address from,
        address to,
        IERC20 erc20,
        uint amount
    ) internal transferAudit(from, to, erc20, amount) {
        // 使用授信转账给目标地址
        if (amount > 0) {
            erc20.safeTransferFrom(from, to, amount);
        }
    }

    constructor() {}
}
