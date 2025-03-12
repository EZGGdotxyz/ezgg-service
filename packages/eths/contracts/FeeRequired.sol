// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./FeeMaster.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

abstract contract FeeRequired {
    event FeeCollected(
        string indexed txCode,
        uint256 time,
        address from,
        address to,
        address erc20,
        uint amount
    );

    error InvalidFeeMasterAddress();
    error FeeUnpaid(string txCode);

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

    function feeReceiver() internal view returns (address) {
        return feeMaster.getFeeReceiver();
    }

    modifier feeCollector(
        string calldata txCode,
        IERC20 erc20,
        uint amount
    ) {
        feeMaster.verifyTransaction(txCode, erc20, amount);
        _;
        feeMaster.startTransaction(txCode);

        emit FeeCollected(
            txCode,
            block.timestamp,
            msg.sender,
            feeReceiver(),
            address(erc20),
            amount
        );
    }

    modifier transactional(string calldata txCode) {
        if (!feeMaster.isInTransaction(txCode)) {
            revert FeeUnpaid(txCode);
        }
        _;
        feeMaster.endTransaction(txCode);
    }
}
