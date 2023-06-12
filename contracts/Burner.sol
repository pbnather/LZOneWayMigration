// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./lzApp/LzApp.sol";

contract Burner is LzApp, Pausable {
    using SafeERC20 for IERC20;

    error TooSmallFee();
    error AmountIsZero();
    error DstAddressIsZero();

    event MigrationStarted(
        address indexed user,
        uint256 indexed amount,
        uint64 indexed nonce
    );

    IERC20 public immutable token;
    uint16 public immutable dstChainId;

    constructor(
        address _lzEndpoint,
        address _token,
        uint16 _dstChainId
    ) LzApp(_lzEndpoint) {
        require(_lzEndpoint != address(0));
        require(_token != address(0));
        token = IERC20(_token);
        dstChainId = _dstChainId;
        _pause();
    }

    function estimateFee(
        uint256 _amount,
        address _dstAddress
    ) external view returns (uint256) {
        if (_amount == 0) revert AmountIsZero();
        if (_dstAddress == address(0)) revert DstAddressIsZero();
        bytes memory payload = abi.encode(_dstAddress, _amount);
        (uint256 fee, ) = lzEndpoint.estimateFees(
            dstChainId,
            address(this),
            payload,
            false,
            bytes("")
        );
        return fee;
    }

    function migrate(
        uint256 _amount,
        address _dstAddress,
        uint256 fee
    ) external payable whenNotPaused returns (uint64) {
        if (msg.value < fee || fee == 0) revert TooSmallFee();
        if (_amount == 0) revert AmountIsZero();
        if (_dstAddress == address(0)) revert DstAddressIsZero();
        token.safeTransferFrom(msg.sender, address(this), _amount);

        // Send tx to LayerZero Endpoint
        bytes memory payload = abi.encode(_dstAddress, _amount);
        _lzSend(
            dstChainId,
            payload,
            payable(msg.sender),
            address(0x0),
            bytes(""),
            fee
        );

        // Get cross-chain tx nonce
        uint64 nonce = lzEndpoint.getOutboundNonce(dstChainId, address(this));
        emit MigrationStarted(msg.sender, _amount, nonce);
        return nonce;
    }

    function _blockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal virtual override {}

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
