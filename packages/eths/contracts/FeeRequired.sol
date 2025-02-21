// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {FeeMaster} from "./FeeMaster.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

abstract contract FeeRequired {
    error InvalidFeeMasterAddress();
    error FeeOutOfBalance();

    event FeeCollected(
        address from,
        address to,
        address erc20Address,
        uint amount
    );

    // 费用管理合约地址
    address private feeMaster;

    constructor(address _feeMasterAddress) {
        _setFeeMaster(_feeMasterAddress);
    }

    function _setFeeMaster(address _feeMaster) internal {
        if (_feeMaster == address(0)) {
            revert InvalidFeeMasterAddress();
        }
        feeMaster = _feeMaster;
    }

    function collectFee(
        address erc20Address,
        uint amount
    ) internal returns (uint, address) {
        // 计算并支付手续费
        (uint fee, address feeReceiver) = feeCalculate(erc20Address, amount);
        // 从代币地址实例化代币合约
        IERC20 erc20 = IERC20(erc20Address);
        // 检查合约持有代币余额是否足够支付
        if (erc20.balanceOf(address(this)) < fee) {
            revert FeeOutOfBalance();
        }
        // 使用合约中持有的代币支付给目标钱包
        if (amount > 0) {
            erc20.transfer(feeReceiver, fee);
        }
        emit FeeCollected(address(this), feeReceiver, erc20Address, fee);
        return (fee, feeReceiver);
    }

    function feeCalculate(
        address erc20Address,
        uint amount
    ) internal view returns (uint, address) {
        FeeMaster feeMasterContract = FeeMaster(feeMaster);
        return feeMasterContract.feeCalculate(erc20Address, amount);
    }
}
