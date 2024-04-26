// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
//import '@uniswap/v3-core/contracts/libraries/SafeCast.sol';
// import '@uniswap/v3-core/contracts/libraries/TickMath.sol';
import '@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3MintCallback.sol';
import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';

import "../utils/Printer.sol";

contract UniswapV3MintCallee is IUniswapV3MintCallback {
    using SafeCast for uint256;

    function mint(
        address pool,
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external {
        // Printer.log("-------------------------uniswapV3MintCallback--------------------------"); 
        // Printer.log("pool", pool);
        // Printer.log("recipient", recipient); 
        // Printer.log("tickLower", int256(tickLower));  
        // Printer.log("tickUpper", int256(tickUpper));  
        // Printer.log("amount", uint256(amount));  
        IUniswapV3Pool(pool).mint(recipient, tickLower, tickUpper, amount, abi.encode(msg.sender));
    }

    event MintCallback(uint256 amount0Owed, uint256 amount1Owed);

    function uniswapV3MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata data
    ) external override {
        address sender = abi.decode(data, (address));
        Printer.log("-------------------------uniswapV3MintCallback--------------------------"); 
        Printer.log("sender", sender);
        Printer.log("amount0Owed", amount0Owed); 
        Printer.log("amount1Owed", amount1Owed);  
        Printer.log("token0", IERC20Metadata(IUniswapV3Pool(msg.sender).token0()).symbol()); 
        Printer.log("token1", IERC20Metadata(IUniswapV3Pool(msg.sender).token1()).symbol()); 

        emit MintCallback(amount0Owed, amount1Owed);
        if (amount0Owed > 0)
            IERC20(IUniswapV3Pool(msg.sender).token0()).transferFrom(sender, msg.sender, amount0Owed);
        if (amount1Owed > 0)
            IERC20(IUniswapV3Pool(msg.sender).token1()).transferFrom(sender, msg.sender, amount1Owed);
    }

}