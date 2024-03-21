// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;

import "../repay/RepayUtils.sol";

interface IRepayHandler {
    function executeRepay(address account, RepayUtils.ExecuteRepayParams calldata params) external returns (bytes32);
}