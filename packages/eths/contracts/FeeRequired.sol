// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./FeeMaster.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

abstract contract FeeRequired {
    using SafeERC20 for IERC20;

    error InvalidFeeMasterAddress();
    error FeeOutOfBalance();
    error FeeOutOfAmount();

    event FeeCollected(
        uint256 time,
        address from,
        address to,
        address erc20Address,
        uint amount
    );

    // 费用管理合约地址
    FeeMaster private feeMaster;

    constructor(FeeMaster _feeMaster) {
        _setFeeMaster(_feeMaster);
    }

    function _setFeeMaster(FeeMaster _feeMaster) internal {
        if (address(_feeMaster) == address(0)) {
            revert InvalidFeeMasterAddress();
        }
        feeMaster = _feeMaster;
    }

    modifier feedAudit(
        address from,
        IERC20 erc20,
        uint amount
    ) {
        // 计算并支付手续费
        (uint fee, address feeReceiver) = feeCalculate(erc20, amount);
        // 检查合约持有代币余额是否足够支付
        if (erc20.balanceOf(from) < fee) {
            revert FeeOutOfBalance();
        }
        // 检查手续费是否超过操作代币数量
        if (fee > amount) {
            revert FeeOutOfAmount();
        }
        _;
        emit FeeCollected(
            block.timestamp,
            from,
            feeReceiver,
            address(erc20),
            fee
        );
    }

    /**
     * 使用合约中持有的代币支付给目标钱包
     *
     * @param erc20 ERC20代币合约
     * @param amount 操作代币数量
     * @return 手续费
     * @return 手续费收取地址
     */
    function _collectFee(
        IERC20 erc20,
        uint amount
    ) internal feedAudit(address(this), erc20, amount) returns (uint, address) {
        (uint fee, address feeReceiver) = feeCalculate(erc20, amount);
        if (fee > 0) {
            erc20.safeTransfer(feeReceiver, fee);
        }
        return (fee, feeReceiver);
    }

    /**
     * 使用授信钱包地址的代币支付给目标钱包
     *
     * @param from 授信钱包地址
     * @param erc20 ERC20代币合约
     * @param amount 操作代币数量
     * @return 手续费
     * @return 手续费收取地址
     */
    function _collectFeeFrom(
        address from,
        IERC20 erc20,
        uint amount
    ) internal feedAudit(from, erc20, amount) returns (uint, address) {
        (uint fee, address feeReceiver) = feeCalculate(erc20, amount);
        if (fee > 0) {
            erc20.safeTransferFrom(from, feeReceiver, fee);
        }
        return (fee, feeReceiver);
    }

    function feeCalculate(
        IERC20 erc20,
        uint amount
    ) public view returns (uint, address) {
        return feeMaster.feeCalculate(erc20, amount);
    }
}
