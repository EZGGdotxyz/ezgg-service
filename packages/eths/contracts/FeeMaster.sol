// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FeeMaster is Ownable {
    using SafeERC20 for IERC20;

    struct Transaction {
        bool isSet;
        address txOwner;
    }

    error IncorrectFeeReceiver();
    error IncorrectIssuingAuthority();
    error IncorrectTxOwner();

    address feeReceiver;
    address feeIssuingAuthority;
    mapping(string => Transaction) feeCollected;

    constructor(address initialOwner) Ownable(initialOwner) {
        setFeeReceiver(initialOwner);
        setFeeIssuingAuthority(initialOwner);
    }

    function setFeeReceiver(address _feeReceiver) public onlyOwner {
        if (_feeReceiver == address(0)) {
            revert IncorrectFeeReceiver();
        }
        feeReceiver = _feeReceiver;
    }

    function getFeeReceiver() public view returns (address) {
        return feeReceiver;
    }

    function setFeeIssuingAuthority(
        address _feeIssuingAuthority
    ) public onlyOwner {
        if (_feeIssuingAuthority == address(0)) {
            revert IncorrectIssuingAuthority();
        }
        feeIssuingAuthority = _feeIssuingAuthority;
    }

    function verifyTransaction(
        string calldata txCode,
        IERC20 erc20,
        uint amount
    ) public {}

    function startTransaction(string calldata txCode) public {
        feeCollected[txCode] = Transaction(true, msg.sender);
    }

    function isInTransaction(
        string calldata txCode
    ) public view returns (bool) {
        return feeCollected[txCode].isSet;
    }

    function endTransaction(string calldata txCode) public {
        if (
            !feeCollected[txCode].isSet &&
            feeCollected[txCode].txOwner != msg.sender
        ) {
            revert IncorrectTxOwner();
        }
        _closeTransaction(txCode);
    }

    function closeTransaction(string calldata txCode) public onlyOwner {
        _closeTransaction(txCode);
    }

    function _closeTransaction(string calldata txCode) internal {
        delete feeCollected[txCode];
    }
}
