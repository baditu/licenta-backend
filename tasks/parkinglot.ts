import {task} from "hardhat/config"
import { TaskArguments } from "hardhat/types"
import { ParkingLot } from "../typechain/contracts/ParkingLot";
import { ParkingLot__factory } from "../typechain/factories/contracts/ParkingLot__factory"

task("deploy:ParkingLot")
 .setAction(async function (taskArguments: TaskArguments, { ethers }) {
   const ParkingLotFactory: ParkingLot__factory = <ParkingLot__factory>(
     await ethers.getContractFactory("ParkingLot")
   );
   const ParkingLot: ParkingLot = <ParkingLot>(
     await ParkingLotFactory.deploy()
   );
   await ParkingLot.deployed();
   console.log("ParkingLot deployed to: ", ParkingLot.address);
 });