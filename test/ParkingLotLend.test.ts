import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";


describe("ParkingLotLend test", async () => {
  let ParkingLotLendFactory: any;
  let ParkingLotLendContract: any;

  let ParkingLotFactory: any;
  let ParkingLotContract: any;

  let LendingMarketFactory: any;
  let LendingMarketContract: any;

  let BadonFactory: any;
  let BadonContract: any;

  let owner: any;
  let user: any;

  before(async () => {
    [owner, user] = await ethers.getSigners();

    ParkingLotFactory = await ethers.getContractFactory("ParkingLot", owner);

    BadonFactory = await ethers.getContractFactory("Badon", owner);

    LendingMarketFactory = await ethers.getContractFactory(
      "LendingMarket",
      owner
    );

    ParkingLotLendFactory = await ethers.getContractFactory(
      "ParkingLotLend",
      owner
    );
  });

  beforeEach(async () => {
    ParkingLotLendContract = await ParkingLotLendFactory.deploy();
    ParkingLotContract = await ParkingLotFactory.deploy();
    BadonContract = await BadonFactory.deploy();
    LendingMarketContract = await LendingMarketFactory.deploy(
      ParkingLotLendContract.address,
      ParkingLotContract.address,
      BadonContract.address
    );

    await ParkingLotLendContract.setLender(LendingMarketContract.address);
  });

  describe("Collection must have name and symbol", async () => {
    it("Name must be equal to ParkingLotLend", async () => {
      expect(await ParkingLotLendContract.name()).to.be.equals(
        "ParkingLotLend"
      );
    });

    it("Symbol must be equal to LPRKL", async () => {
      expect(await ParkingLotLendContract.symbol()).to.be.equals("LPRKL");
    });
  });

  describe("Can set a lender", async () => {
    it("Only default admin role can set the lender", async () => {
      await expect(ParkingLotLendContract.setLender(user.address))
        .to.emit(ParkingLotLendContract, "LenderChanged")
        .withArgs(user.address);
    });

    expect(await ParkingLotLendContract.lender()).to.be.equals(user.address);
  });

  describe("Mint function", async () => {
    it("Only owner or lender can mint", async () => {
      await expect(ParkingLotLendContract.connect(owner).mint(owner.address, 0))
        .to.emit(ParkingLotLendContract, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, 0);

      await expect(ParkingLotLendContract.connect(user).mint(user.address, 0))
        .to.be.reverted;
    });

    it("Owner can mint for 4 times and the display the balance of users", async () => {
      await ParkingLotLendContract.connect(owner).mint(user.address, 0);
      await ParkingLotLendContract.connect(owner).mint(user.address, 1);
      await ParkingLotLendContract.connect(owner).mint(user.address, 2);
      await ParkingLotLendContract.connect(owner).mint(user.address, 3);

      expect(await ParkingLotLendContract.balanceOf(user.address)).to.be.equals(
        4
      );
    });
  });

  describe("Burn function", async () => {
    it("Only owner can burn nfts", async () => {
      await ParkingLotLendContract.connect(owner).mint(owner.address, 0);
      await ParkingLotLendContract.connect(owner).mint(owner.address, 1);

      await expect(ParkingLotLendContract.connect(owner).burn(1))
        .to.emit(ParkingLotLendContract, "Transfer")
        .withArgs(owner.address, ethers.constants.AddressZero, 1);
    });

    it("Signer can burn nfts only if the owner approve that", async () => {
      await ParkingLotLendContract.connect(owner).mint(user.address, 0);
      await ParkingLotLendContract.connect(owner).mint(user.address, 1);

      await ParkingLotLendContract.connect(user).approve(owner.address, 0);
      await ParkingLotLendContract.connect(owner).burn(0);
      expect(await ParkingLotLendContract.balanceOf(user.address)).to.be.equals(
        1
      );
    });
  });

  describe("Can return tokens of owner", async () => {
    it("Can return tokens of owner", async () => {
      await ParkingLotLendContract.connect(owner).mint(user.address, 0);
      await ParkingLotLendContract.connect(owner).mint(user.address, 1);
      await ParkingLotLendContract.connect(owner).mint(user.address, 2);
      await ParkingLotLendContract.connect(owner).mint(user.address, 3);
      await ParkingLotLendContract.connect(owner).mint(user.address, 4);

      const tokens = await ParkingLotLendContract.tokensOfOwner(user.address);

      for (let i = 0; i < 5; i++) {
        expect(tokens[i]).to.be.equals(BigNumber.from(i));
      }
    });
  });

  it("It can return token URI", async () => {
    await ParkingLotContract.connect(owner).setBaseURI(
        "https://ipfs:ana_are_mere.com/"
      );
    await ParkingLotContract.connect(owner).safeMint(user.address);
    
    expect(await ParkingLotLendContract.tokenURI(0)).to.be.equals(
      "https://ipfs:ana_are_mere.com/0.json"
    );
  });

  it("It supports interfaces", async () => {
    expect(await ParkingLotLendContract.supportsInterface("0x79f154c4")).to.be.equal(true); // ERC721Enumerable
    expect(await ParkingLotLendContract.supportsInterface("0x780e9d63")).to.be.equal(true); // IERC721Enumerable
    expect(await ParkingLotLendContract.supportsInterface("0x5b5e139f")).to.be.equal(true); // IERC721Metadata
    expect(await ParkingLotLendContract.supportsInterface("0x80ac58cd")).to.be.equal(true); // IERC721
    expect(await ParkingLotLendContract.supportsInterface("0x01ffc9a7")).to.be.equal(true); // IERC165
    expect(await ParkingLotLendContract.supportsInterface("0x5bfad1a8")).to.be.equal(true); // AccessControlEnumerable
    expect(await ParkingLotLendContract.supportsInterface("0xda8def73")).to.be.equal(true); // AccessControl
    expect(await ParkingLotLendContract.supportsInterface("0x5a05180f")).to.be.equal(true); // IAccessControlEnumerable
  });
});