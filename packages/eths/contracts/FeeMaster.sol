// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

contract FeeMaster is Ownable {
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
        feeReceiver = initialOwner;
    }

    function setFeeReceiver(address _feeReceiver) public onlyOwner {
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
        address erc20Address,
        uint amount
    ) public view returns (uint, address) {
        FeeRule memory feeRule = feeRules[erc20Address];
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
