// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title SyraToken
/// @notice Fixed-supply ERC-20 for Syra on BNB Smart Chain (DappBay listing)
contract SyraToken is ERC20 {
    constructor(uint256 initialSupply, address recipient) ERC20("Syra", "SYRA") {
        _mint(recipient, initialSupply);
    }
}
