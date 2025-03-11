// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SimpleTransfer {
    using SafeERC20 for IERC20;

    event TransferEvent(
        uint256 time,
        address from,
        address to,
        address erc20,
        uint amount,
        uint fee
    );

    function transfer(address to, IERC20 erc20, uint amount) public {
        erc20.safeTransferFrom(msg.sender, to, amount);

        emit TransferEvent(
            block.timestamp,
            msg.sender,
            to,
            address(erc20),
            amount,
            0
        );
    }
}
