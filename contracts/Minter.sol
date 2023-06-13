// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IMintable.sol";
import "./lzApp/LzApp.sol";

contract Minter is LzApp {
    error TooSmallFee();
    error AmountIsZero();
    error DstAddressIsZero();

    event MigrationFinished(
        address indexed user,
        uint256 indexed amount,
        uint64 indexed nonce
    );

    IMintable public immutable token;

    constructor(address _lzEndpoint, address _token) LzApp(_lzEndpoint) {
        require(_lzEndpoint != address(0));
        require(_token != address(0));
        token = IMintable(_token);
    }

    function _blockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal virtual override {
        // Authorization is done using TrustedRemotes (LZApp.sol)
        (address user, uint256 amount) = abi.decode(
            _payload,
            (address, uint256)
        );
        token.mint(user, amount);
        emit MigrationFinished(user, amount, _nonce);
    }
}
