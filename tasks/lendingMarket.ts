import {task} from "hardhat/config"
import { TaskArguments } from "hardhat/types"
import { LendingMarket } from "../typechain/contracts/LendingMarket.sol";
import { LendingMarket__factory } from "../typechain/factories/contracts/LendingMarket.sol/LendingMarket__factory"

task("deploy:LendingMarket")
 .setAction(async function (taskArguments: TaskArguments, { ethers }) {
   const LendingMarketFactory: LendingMarket__factory = <LendingMarket__factory>(
     await ethers.getContractFactory("LendingMarket")
   );
   const LendingMarket: LendingMarket = <LendingMarket>(
     await LendingMarketFactory.deploy("0x2952e5f3880B00d0b822Ff9a6a9E152a37563A7D", "0x843C2538724f4D595a905d1Ea937361934D209a9", "0x5c71b7E64Dae588840F50106BB5Bf39090f0DcCD")
   );
   await LendingMarket.deployed();
   console.log("LendingMarket deployed to: ", LendingMarket.address);
 });