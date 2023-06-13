// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/IMintable.sol";

// this is a MOCK
contract ERC20Mock is ERC20, IMintable, Ownable, Pausable {
    constructor(
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {}

    function mintOwner(address _to, uint _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    function mint(address _to, uint _amount) external whenNotPaused {
        _mint(_to, _amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
