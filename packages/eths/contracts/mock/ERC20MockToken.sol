// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20MockToken is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {}

    function airdrop(uint amount) public {
        _mint(msg.sender, amount);
    }
}
