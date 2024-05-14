// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;

import "../data/Keys.sol";

import "../position/Position.sol";

//import "../oracle/OracleStoreUtils.sol";
//import "../oracle/OracleUtils.sol";

import "./ReaderUtils.sol";
import "./ReaderPositionUtils.sol";
import "./ReaderDexUtils.sol";


// @title Reader
// @dev Library for read functions
contract Reader {
    using SafeCast for uint256;
    using Position for Position.Props;

   function getPosition(address dataStore, bytes32 positionKey) external view returns (Position.Props memory) {
        return ReaderPositionUtils._getPosition(dataStore, positionKey);
    }

    function getPositions(address dataStore, address account) external view returns (Position.Props[] memory) {
        return ReaderPositionUtils._getPositions(dataStore, account);
    }

    function getPositionsInfo(address dataStore, address account) external view returns (ReaderPositionUtils.GetPositionInfo[] memory) {
        uint256 positionCount = PositionStoreUtils.getAccountPositionCount(dataStore, account);
        return ReaderPositionUtils._getPositionsInfo(dataStore, account, 0, positionCount);
    }

    function getPool(address dataStore, address poolKey) external view returns (Pool.Props memory) {
        return ReaderUtils._getPool(dataStore, poolKey);
    }

    function getPools(address dataStore) external view returns (Pool.Props[] memory) {
        uint256 poolsCount = PoolStoreUtils.getPoolCount(dataStore);
        return ReaderUtils._getPools(dataStore, 0, poolsCount);
    }

    function getPoolInfo(address dataStore, address poolKey) external view returns (ReaderUtils.GetPoolInfo memory) {
        return ReaderUtils._getPoolInfo(dataStore, poolKey);
    }

    function getPoolsInfo(address dataStore) external view returns (ReaderUtils.GetPoolInfo[] memory) {
        uint256 poolsCount = PoolStoreUtils.getPoolCount(dataStore);
        return ReaderUtils._getPoolsInfo(dataStore, 0, poolsCount);
    }


    function getLiquidityAndDebts(address dataStore, address account) external view returns (ReaderUtils.GetLiquidityAndDebt[] memory) {
        uint256 poolsCount = PoolStoreUtils.getPoolCount(dataStore);
        address[] memory poolKeys = PoolStoreUtils.getPoolKeys(dataStore, 0, poolsCount);

        ReaderUtils.GetLiquidityAndDebt[] memory accountLiquidities = 
            new ReaderUtils.GetLiquidityAndDebt[](poolKeys.length);
        for (uint256 i; i < poolKeys.length; i++) {
            address poolToken = PoolStoreUtils.getPoolToken(dataStore, poolKeys[i]);
            address debtToken = PoolStoreUtils.getDebtToken(dataStore, poolKeys[i]);
            accountLiquidities[i] = 
                ReaderUtils._getLiquidityAndDebt(account, poolToken, debtToken);
        }
        //TODO:should delete empty items
        return accountLiquidities;
    }

    function getMarginsAndSupplies(address dataStore, address account) external view returns (ReaderUtils.GetMarginAndSupply[] memory) {
        uint256 poolsCount = PoolStoreUtils.getPoolCount(dataStore);
        address[] memory poolKeys = PoolStoreUtils.getPoolKeys(dataStore, 0, poolsCount);

        ReaderUtils.GetMarginAndSupply[] memory marginsAndSupplies = 
            new ReaderUtils.GetMarginAndSupply[](poolKeys.length);
        for (uint256 i; i < poolKeys.length; i++) {
            marginsAndSupplies[i] = 
                ReaderUtils._getMarginAndSupply(dataStore, account, poolKeys[i]);
        }
        //TODO:should delete empty items
        return marginsAndSupplies;
    }

    function getLiquidityAndDebt(address dataStore, address poolKey, address account) external view returns (ReaderUtils.GetLiquidityAndDebt memory) {
        address poolToken = PoolStoreUtils.getPoolToken(dataStore, poolKey);
        address debtToken = PoolStoreUtils.getDebtToken(dataStore, poolKey);
        ReaderUtils.GetLiquidityAndDebt memory accountLiquidity = 
            ReaderUtils._getLiquidityAndDebt(account, poolToken, debtToken);
        return accountLiquidity;
    }

    // function getOracle(address dataStore, address underlyingAsset) external view returns (address) {
    //     return OracleStoreUtils.get(dataStore, underlyingAsset);
    // }

    // function getOracleDecimals(address dataStore, address underlyingAsset) external view returns (uint256) {
    //     return OracleStoreUtils.getOracleDecimals(dataStore, underlyingAsset);
    // }

    function getPrice(address dataStore, address underlyingAsset) external view returns (uint256) {
        return OracleUtils.getPrice(dataStore, underlyingAsset);
    }

    function getMaxAmountToRedeem(address dataStore, address underlyingAsset, address account) external view returns (uint256) {
        return ReaderUtils._getMaxAmountToRedeem(dataStore, underlyingAsset, account);
    }

    function getLiquidationHealthFactor(address dataStore, address account) external view returns (ReaderUtils.GetLiquidationHealthFactor memory) {
        return ReaderUtils._getLiquidationHealthFactor(dataStore, account);
    }

    function getDexPool(address dataStore, address underlyingAssetA, address underlyingAssetB) external view returns (address) {
        return ReaderDexUtils._getDexPool(dataStore, underlyingAssetA, underlyingAssetB);
    }


}
