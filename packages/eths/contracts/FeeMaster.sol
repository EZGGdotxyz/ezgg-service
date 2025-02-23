// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FeeMaster is Ownable {
    error IncorrectFeeReceiver();

    enum FeeType {
        FIXED,
        PERCENT
    }

    struct FeeRule {
        bool isSet;
        FeeType feeType;
        uint value;
    }

    address feeReceiver;
    FeeRule defaultRule = FeeRule(true, FeeType.FIXED, 0);
    mapping(address => FeeRule) feeRules;

    constructor(address initialOwner) Ownable(initialOwner) {
        setFeeReceiver(initialOwner);
    }

    function setFeeReceiver(address _feeReceiver) public onlyOwner {
        if (_feeReceiver == address(0)) {
            revert IncorrectFeeReceiver();
        }
        feeReceiver = _feeReceiver;
    }

    function addFeeRule(
        address erc20Address,
        FeeType feeType,
        uint value
    ) public onlyOwner {
        feeRules[erc20Address] = FeeRule(true, feeType, value);
    }

    function feeCalculate(
        IERC20 erc20,
        uint amount
    ) public view returns (uint, address) {
        FeeRule memory feeRule = feeRules[address(erc20)];
        if (!feeRule.isSet) {
            feeRule = defaultRule;
        }

        uint fee = 0;
        if (feeRule.feeType == FeeType.FIXED) {
            fee = feeRule.value;
        } else if (feeRule.feeType == FeeType.PERCENT) {
            fee = (amount / 100) * feeRule.value;
        }

        return (fee, feeReceiver);
    }
}
