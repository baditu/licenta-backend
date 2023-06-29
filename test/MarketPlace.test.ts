import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

xdescribe("Marketplace Test", async () => {
  let BadonFactory: any;
  let BadonContract: any;

  let ParkingLotFactory: any;
  let ParkingLotContract: any;

  let MarketplaceFactory: any;
  let Marketplace: any;

  let owner: any;
  let user: any;
  let andy: any;
  let bodo: any;
  let depositForDApp: any;

  let DENOMINATOR = BigNumber.from(10000);

  before(async () => {
    [owner, user, andy, bodo, depositForDApp] = await ethers.getSigners();

    BadonFactory = await ethers.getContractFactory("Badon", owner);
    ParkingLotFactory = await ethers.getContractFactory("ParkingLot", owner);
    MarketplaceFactory = await ethers.getContractFactory("Marketplace", owner);
  });

  beforeEach(async () => {
    BadonContract = await BadonFactory.deploy();
    ParkingLotContract = await ParkingLotFactory.deploy();

    Marketplace = await MarketplaceFactory.deploy(
      ParkingLotContract.address,
      BadonContract.address
    );

    await Marketplace.setListPrice(ethers.utils.parseEther("0.01"));

    await Marketplace.setBadonsPercentageForDApp(BigNumber.from(1000));

    await Marketplace.setDepositForDApp(depositForDApp.address);

    //we need to mint some NFTs for our user
    await ParkingLotContract.connect(owner).mintBatch(user.address, 5);

    //we need to mint some badons for andy to buy the nft
    await BadonContract.connect(owner).mint(
      andy.address,
      ethers.utils.parseEther("10")
    );
  });

  it("Should calculate the percentage correct", async () => {
    const price = ethers.utils.parseEther("10");

    const percentageForDApp = price
      .mul(await Marketplace.badonsPercentageForDApp())
      .div(DENOMINATOR);

    expect(percentageForDApp).to.be.equals(ethers.utils.parseEther("1"));
  });

  it("User should be able to list a NFT", async () => {
    //we must approve the market to sell our nfts
    await ParkingLotContract.connect(user).approve(Marketplace.address, 1);

    await expect(
      Marketplace.connect(user).listNFT(1, ethers.utils.parseEther("1"))
    )
      .to.emit(Marketplace, "NFTListed")
      .withArgs(1, user.address, ethers.utils.parseEther("1"));

    console.log(await ParkingLotContract.balanceOf(Marketplace.address));
  });

  it("Use shoyld be able to cancel a NFT", async () => {
    await ParkingLotContract.connect(user).approve(Marketplace.address, 1);

    await Marketplace.connect(user).listNFT(1, ethers.utils.parseEther("1"));

    console.log(await ParkingLotContract.balanceOf(Marketplace.address));

    await expect(Marketplace.connect(user).cancelNFT(1))
      .to.emit(Marketplace, "CancelSellingNFT")
      .withArgs(user.address, 1);

    console.log(await ParkingLotContract.balanceOf(Marketplace.address));
  });

  it("Use shoyld be able to buy a NFT", async () => {
    await ParkingLotContract.connect(user).approve(Marketplace.address, 1);

    await Marketplace.connect(user).listNFT(1, ethers.utils.parseEther("1"));

    const amountToPay = ethers.utils.parseEther("1");
    const percentage = amountToPay
      .mul(await Marketplace.badonsPercentageForDApp())
      .div(DENOMINATOR);

    console.log(percentage);

    console.log(await ParkingLotContract.balanceOf(Marketplace.address));

    console.log(
      "badons before buy: ",
      await BadonContract.balanceOf(andy.address)
    );

    await BadonContract.connect(andy).approve(
      Marketplace.address,
      ethers.utils.parseEther("10")
    );

    await expect(Marketplace.connect(andy).buyNFT(1))
      .to.emit(Marketplace, "NFTBought")
      .withArgs(1, andy.address, amountToPay.sub(percentage));

    expect(await BadonContract.balanceOf(andy.address)).to.be.equals(
      ethers.utils.parseEther("9")
    );
    expect(
      await ParkingLotContract.balanceOf(Marketplace.address)
    ).to.be.equals(0);
    expect(await ParkingLotContract.balanceOf(andy.address)).to.be.equals(1);
  });
});
