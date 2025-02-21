// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

abstract contract TokenPayable {
    event TokenReceived(
        address from,
        address to,
        address erc20Address,
        uint amount
    );

    event TokenPaid(
        address from,
        address to,
        address erc20Address,
        uint amount
    );

    error AllowanceRequire();
    error AmountIncorrect();
    error OutOfBalance();

    modifier onlyAllowance(address erc20Address, uint amount) {
        _checkAllowance(IERC20(erc20Address), amount);
        _;
    }

    modifier receiver(address erc20Address, uint amount) {
        // 金额不能小于等于0
        if (amount <= 0) {
            revert AmountIncorrect();
        }
        IERC20 erc20 = IERC20(erc20Address);
        // 检查合约调用方是否已授权ERC20代币额度给当前合约
        _checkAllowance(erc20, amount);
        // 转移授信代币到当前合约中
        erc20.transferFrom(msg.sender, address(this), amount);
        emit TokenReceived(msg.sender, address(this), erc20Address, amount);
        _;
    }

    function _checkAllowance(IERC20 erc20, uint amount) internal view {
        uint allowance = erc20.allowance(msg.sender, address(this));
        if (allowance < amount) {
            revert AllowanceRequire();
        }
    }

    function _transferFrom(
        address from,
        address to,
        address erc20Address,
        uint amount
    ) internal {
        // 从代币地址实例化代币合约
        IERC20 erc20 = IERC20(erc20Address);
        // 检查用户代币余额是否足够支付
        if (erc20.balanceOf(from) < amount) {
            revert OutOfBalance();
        }
        // 使用授信转账给目标地址
        if (amount > 0) {
            erc20.transferFrom(from, to, amount);
        }
        emit TokenPaid(from, to, erc20Address, amount);
    }

    function _transfer(address to, address erc20Address, uint amount) internal {
        // 从代币地址实例化代币合约
        IERC20 erc20 = IERC20(erc20Address);
        // 检查合约持有代币余额是否足够支付
        if (erc20.balanceOf(address(this)) < amount) {
            revert OutOfBalance();
        }
        // 使用合约中持有的代币支付给目标钱包
        if (amount > 0) {
            erc20.transfer(to, amount);
        }
        emit TokenPaid(address(this), to, erc20Address, amount);
    }

    constructor() {}
}
