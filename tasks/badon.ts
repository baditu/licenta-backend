import {task} from "hardhat/config"
import { TaskArguments } from "hardhat/types"
import { Badon } from "../typechain/contracts/Badon";
import { Badon__factory } from "../typechain/factories/contracts/Badon__factory"


task("deploy:Badon")
 .setAction(async function (taskArguments: TaskArguments, { ethers }) {
   const BadonFactory: Badon__factory = <Badon__factory>(
     await ethers.getContractFactory("Badon")
   );
   const Badon: Badon = <Badon>(
     await BadonFactory.deploy()
   );
   await Badon.deployed();
   console.log("Badon deployed to: ", Badon.address);
 });