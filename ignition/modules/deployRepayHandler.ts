import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { roleStoreModule } from "./deployRoleStore"
import { dataStoreModule } from "./deployDataStore"
import { repayUtilsModule } from "./deployRepayUtils"
// import { hashString } from "../../utils/hash";
// import * as keys from "../../utils/keys";

export const repayHandlerModule = buildModule("RepayHandler", (m) => {
    const { roleStore } = m.useModule(roleStoreModule)
    const { dataStore } = m.useModule(dataStoreModule)
    const { repayUtils } = m.useModule(repayUtilsModule)

    const repayHandler = m.contract("RepayHandler", [roleStore, dataStore], {
        libraries: {
            RepayUtils: repayUtils,
        },    
    });
    // m.call(roleStore, "grantRole",  [repayHandler, keys.CONTROLLER]);

    return { repayHandler };
});

//export default repayHandlerModule;