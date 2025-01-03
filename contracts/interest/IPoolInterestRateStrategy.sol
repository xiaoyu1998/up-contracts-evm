// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.20;

import "./InterestUtils.sol";

interface IPoolInterestRateStrategy {

    function calculateInterestRates(
        InterestUtils.CalculateInterestRatesParams memory params
    ) external view returns (uint256, uint256);

    function getOptimalUsageRatio() external view returns (uint256);
    function getRatebase() external view returns (uint256);
    function getRateSlope1() external view returns (uint256);
    function getRateSlope2() external view returns (uint256);

}