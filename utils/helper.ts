
const { getContract } = require("./deploy")
import { 
    Pool, 
    Position, 
    ReaderUtils, 
    ReaderPositionUtils,
    DexStoreUtils
} from "../typechain-types/contracts/reader/Reader";

export function parsePool(pool) {
    const p: Pool.PropsStructOutput = {
        keyId: pool[0],
        liquidityIndex: pool[1],
        liquidityRate: pool[2],
        borrowIndex: pool[3],
        borrowRate: pool[4],
        interestRateStrategy: pool[5],
        underlyingAsset: pool[6],
        poolToken: pool[7],
        debtToken: pool[8],
        configuration: pool[9],
        // feeFactor: pool[10],
        totalFee: pool[10],
        unclaimedFee: pool[11],
        lastUpdateTimestamp: pool[12]
    };
    return p;
}

export async function getPool(address) {
    const dataStore = await getContract("DataStore");   
    const reader = await getContract("Reader");  
    const poolUsdt = await reader.getPool(dataStore.target, address);
    return parsePool(poolUsdt);
}

export function parsePoolInfo(pool) {
    const p: ReaderUtils.GetPoolInfoStructOutput = {
        keyId: pool[0],
        liquidityIndex: pool[1],
        liquidityRate: pool[2],
        borrowIndex: pool[3],
        borrowRate: pool[4],
        interestRateStrategy: pool[5],
        underlyingAsset: pool[6],
        poolToken: pool[7],
        debtToken: pool[8],
        configuration: pool[9],
        totalFee: pool[10],
        unclaimedFee: pool[11],
        lastUpdateTimestamp: pool[12],
        isActive: pool[13],
        isPaused: pool[14],
        isFrozen: pool[15],
        borrowingEnabled: pool[16],
        decimals: pool[17],
        borrowCapacity: pool[18],
        supplyCapacity: pool[19],        
        feeFactor: pool[20],
        scaledTotalSupply: pool[21], 
        totalSupply: pool[22],
        totalCollateral: pool[23], 
        availableLiquidity: pool[24],
        scaledTotalDebt: pool[25],  
        totalDebt: pool[26],   
        borrowUsageRatio: pool[27],
        optimalUsageRatio: pool[28],
        rateBase: pool[29],
        rateSlope1: pool[30],
        rateSlope2: pool[31],                   
        symbol: pool[32],
        price: pool[33],
        isUsd: pool[34]
    };
    return p;
}

export async function getPoolInfo(address) {
    const dataStore = await getContract("DataStore");   
    const reader = await getContract("Reader");  
    const poolUsdt = await reader.getPoolInfo(dataStore.target, address);
    return parsePoolInfo(poolUsdt);
}

export async function getPoolsInfo(dataStore, reader) {
    const pools = await reader.getPoolsInfo(dataStore.target);
    let ps = [];
    for (let i = 0; i < pools.length; i++) {
         ps[i] = parsePoolInfo(pools[i]);
    }
    return ps;
}

export function parsePosition(position) {
    const p: Position.PropsStructOutput = {
        account: position[0],
        underlyingAsset: position[1],
        entryLongPrice: position[2],
        accLongAmount: position[3],
        entryShortPrice: position[4],
        accShortAmount: position[5],
        positionType: position[6],
        hasCollateral: position[7],
        hasDebt: position[8]
    };
    return p;
}

export async function getPositions(dataStore, reader, address) {
    const positions = await reader.getPositions(dataStore.target, address);
    let ps = [];
    for (let i = 0; i < positions.length; i++) {
         ps[i] = parsePosition(positions[i]);
    }
    return ps;
}

export async function getPosition(dataStore, reader, address, underlyingAsset) {
    return parsePosition(await reader.getPosition(dataStore.target, address, underlyingAsset, {}));

}

export function parsePositionInfo(position) {
    const p: ReaderPositionUtils.GetPositionInfoStructOutput = {
        account: position[0],
        underlyingAsset: position[1],
        positionType: position[2],
        equity: position[3],
        equityUsd: position[4],
        indexPrice: position[5],
        entryPrice: position[6],
        pnlUsd: position[7],
        liquidationPrice: position[8],
        presentageToLiquidationPrice: position[9],
    };
    return p;
}

export async function getPositionsInfo(dataStore, reader, address) {
    const positions = await reader.getPositionsInfo(dataStore.target, address);
    let ps = [];
    for (let i = 0; i < positions.length; i++) {
         ps[i] = parsePositionInfo(positions[i]);
    }
    return ps;
}

export async function getPositionInfo(dataStore, reader, address, underlyingAsset) {
    return parsePositionInfo(await reader.getPositionInfo(dataStore.target, address, underlyingAsset));

}

export function parseMarginAndSupply(s) {
    const m: ReaderUtils.GetMarginAndSupplyStructOutput = {
        underlyingAsset: s[0],
        account: s[1],
        balanceAsset: s[2],
        debt: s[3],
        borrowApy: s[4],
        maxWithdrawAmount: s[5],
        balanceSupply: s[6],
        supplyApy: s[7]
    };
    return m;
}

export async function getAssets(dataStore, reader, address) {
    const s = await reader.getMarginsAndSupplies(dataStore.target, address);
    const accountMarginsAndSupplies = [];
    for (let i = 0; i < s.length; i++) {
         accountMarginsAndSupplies[i] = parseMarginAndSupply(s[i]);
    }
    return accountMarginsAndSupplies;    
}

export async function getMarginAndSupply(dataStore, reader, address, underlyingAsset) {
    return parseMarginAndSupply(await reader.getMarginAndSupply(dataStore.target, address, underlyingAsset));

}

export function parseDex(s) {
    const d: DexStoreUtils.DexStructOutput = {
        key: s[0],
        dex: s[1],
    };
    return d;
}

export async function getDexs(dataStore, reader) {
    const s = await reader.getDexs(dataStore.target);
    const dexs = [];
    for (let i = 0; i < s.length; i++) {
         dexs[i] = parseDex(s[i]);
    }
    return dexs;    
}

export async function getMaxAmountToRedeem(dataStore, reader, address, underlyingAsset) {
    return reader.getMaxAmountToRedeem(dataStore, underlyingAsset, address);
}

export function parseLiquidationHealthFactor(Factor) {
    const f: ReaderUtils.GetLiquidationHealthFactorStructOutput = {
        healthFactor: Factor[0],
        healthFactorLiquidationThreshold: Factor[1],
        isHealthFactorHigherThanLiquidationThreshold: Factor[2],
        userTotalCollateralUsd: Factor[3],
        userTotalDebtUsd: Factor[4],
    };
    return f;
}

export async function getLiquidationHealthFactor(address) {
    const dataStore = await getContract("DataStore");   
    const reader = await getContract("Reader");  
    const f = await reader.getLiquidationHealthFactor(dataStore.target, address);
    return parseLiquidationHealthFactor(f);
}


//Margin And Supply
export async function getSupply(dataStore, reader, address, underlyingAsset) {
    const { balanceSupply } = await getMarginAndSupply(dataStore, reader, address, underlyingAsset);
    return balanceSupply;
}

export async function getCollateral(dataStore, reader, address, underlyingAsset) {
    const { balanceAsset } = await getMarginAndSupply(dataStore, reader, address, underlyingAsset);
    return balanceAsset;
}

export async function getDebt(dataStore, reader, address, underlyingAsset) {
    const { debt } = await getMarginAndSupply(dataStore, reader, address, underlyingAsset);
    return debt;
}

export async function getMaxWithdrawAmount(dataStore, reader, address, underlyingAsset) {
    const { maxWithdrawAmount } = await getMarginAndSupply(dataStore, reader, address, underlyingAsset);
    return maxWithdrawAmount;
}

export async function getSupplyApy(dataStore, reader, address, underlyingAsset) {
    const { supplyApy } = await getMarginAndSupply(dataStore, reader, address, underlyingAsset);
    return supplyApy;
}

export async function getBorrowApy(dataStore, reader, address, underlyingAsset) {
    const { borrowApy } = await getMarginAndSupply(dataStore, reader, address, underlyingAsset);
    return borrowApy;
}

export async function getEquity(dataStore, reader, address, underlyingAsset) {
    const { equity } = await getPositionInfo(dataStore, reader, address, underlyingAsset);
    return equity;
}

//PositionInfo
export async function getEquityUsd(dataStore, reader, address, underlyingAsset) {
    const { equityUsd } = await getPositionInfo(dataStore, reader, address, underlyingAsset);
    return equityUsd;
}

export async function getEntryPrice(dataStore, reader, address, underlyingAsset) {
    const {entryPrice } = await getPositionInfo(dataStore, reader, address, underlyingAsset);
    return entryPrice;
}

//Position
export async function getPositionType(dataStore, reader, address, underlyingAsset) {
    const { positionType } = await getPosition(dataStore, reader, address, underlyingAsset);
    return positionType;
}

export async function getEntryLongPrice(dataStore, reader, address, underlyingAsset) {
    const { entryLongPrice } = await getPosition(dataStore, reader, address, underlyingAsset);
    return entryLongPrice;
}

export async function getAccLongAmount(dataStore, reader, address, underlyingAsset) {
    const { accLongAmount } = await getPosition(dataStore, reader, address, underlyingAsset);
    return accLongAmount;
}

export async function getEntryShortPrice(dataStore, reader, address, underlyingAsset) {
    const { entryShortPrice } = await getPosition(dataStore, reader, address, underlyingAsset);
    return entryShortPrice;
}

export async function getAccShortAmount(dataStore, reader, address, underlyingAsset) {
    const { accShortAmount } = await getPosition(dataStore, reader, address, underlyingAsset);
    return accShortAmount;
}

export async function getHasCollateral(dataStore, reader, address, underlyingAsset) {
    const { hasCollateral } = await getPosition(dataStore, reader, address, underlyingAsset);
    return hasCollateral;
}

export async function getHasDebt(dataStore, reader, address, underlyingAsset) {
    const { hasDebt } = await getPosition(dataStore, reader, address, underlyingAsset);
    return hasDebt;
}




