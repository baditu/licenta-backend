//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import ".././interfaces/IERC721Full.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import ".././interfaces/Structs.sol";

import "hardhat/console.sol";

interface ParkingLotI is IERC721, IERC721Metadata {}

// deployed at: 0xC1256d3Fd70159C379b777C304f93F0eFA79c532

contract LendingMarket is IERC721Receiver, Ownable, ReentrancyGuard {
  using EnumerableSet for EnumerableSet.AddressSet;

  IERC721Full public immutable parkingLotLend;
  ParkingLotI public immutable parkingLot;
  IERC20 public immutable badons;

  mapping(uint256 => Lot) public lots;

  uint16 public constant DENOMINATOR = 10_000;
  uint16 public badonsPercentageForDApp;
  address public depositForDApp;

  uint128 public minUnitsOfPeriod;

  EnumerableSet.AddressSet private _allowedReceivers;

  event LendLot(
    address indexed _lender,
    uint256 _periodInDays,
    uint256 _periodInHours,
    uint256 _badonsPerPeriod,
    uint256 _tokenId
  );

  event CancelLeding(address _owner, uint256 _tokenId);
  event LotBorrowed(
    address indexed _borrower,
    address indexed _lender,
    uint256 _price
  );
  event LotRedeemed(address indexed _lender, uint256 _tokenId);
  event AllowedReceiverModified(address indexed _receiver, bool _add);
  event SetBadonsPercentageForDApp(uint256 _newPercentage);
  event SetDepositForDApp(address _newDepositForDApp);

  error NotTheOwner();
  error TooShort();
  error Unauthorized();
  error AlreadyBorrowed();
  error NotForLoan();
  error NotExpired();
  error Expired();
  error InvalidPercentage();
  error InvalidAction();
  error AddressZero();

  constructor(
    IERC721Full _parkingLotLend,
    ParkingLotI _parkingLot,
    IERC20 _badons
  ) {
    parkingLotLend = _parkingLotLend;
    parkingLot = _parkingLot;
    badons = _badons;

    minUnitsOfPeriod = 1;
  }

  /**
   * @dev you must approve the token id to be transfer by the Lender contract
   */
  function lendLot(
    uint256 _tokenId,
    uint256 _unitsOfPeriodInDays,
    uint256 _unitsOfPeriodInHours,
    uint256 _badonsPerPeriod
  ) external nonReentrant {
    if (_unitsOfPeriodInHours < minUnitsOfPeriod && _unitsOfPeriodInDays == 0) revert TooShort();
    if (parkingLot.ownerOf(_tokenId) != msg.sender) revert NotTheOwner();

    require(
      _unitsOfPeriodInDays > 0 || _unitsOfPeriodInHours > 0,
      "Period for loan must be grater than 0"
    );

    lots[_tokenId] = Lot({
      targetId: uint32(_tokenId),
      borrowed: false,
      borrower: address(0),
      lender: msg.sender,
      startTime: 0,
      endTime: 0,
      daysOfPeriod: _unitsOfPeriodInDays,
      hoursOfPeriod: _unitsOfPeriodInHours,
      badonsPerPeriod: _badonsPerPeriod
    });

    parkingLot.safeTransferFrom(msg.sender, address(this), _tokenId, "");

    emit LendLot(
      msg.sender,
      _unitsOfPeriodInDays,
      _unitsOfPeriodInHours,
      _badonsPerPeriod,
      _tokenId
    );
  }

  function cancelLendingLot(uint256 _tokenId) external nonReentrant {
    Lot storage lot = lots[_tokenId];

    if (lot.lender != msg.sender) revert NotTheOwner();
    if (lot.borrower != address(0)) revert AlreadyBorrowed();
    delete lots[_tokenId];

    parkingLot.safeTransferFrom(address(this), msg.sender, _tokenId, "");

    emit CancelLeding(msg.sender, _tokenId);
  }

  function borrowLot(uint256 _tokenId) external nonReentrant {
    Lot storage lot = lots[_tokenId];
    if (lot.daysOfPeriod == 0 && lot.hoursOfPeriod == 0) revert NotForLoan();
    if (lot.borrower != address(0)) revert AlreadyBorrowed();

    lot.borrowed = true;
    lot.borrower = msg.sender;
    lot.startTime = block.timestamp;
    lot.endTime =
      block.timestamp +
      lot.daysOfPeriod *
      86400 +
      lot.hoursOfPeriod *
      3600;

    //calculate percentage for DApp
    uint256 totalBadons = lot.badonsPerPeriod *
      (24 * lot.daysOfPeriod + lot.hoursOfPeriod);
    uint256 percentage = (totalBadons * badonsPercentageForDApp) / DENOMINATOR;

    totalBadons -= percentage;

    badons.transferFrom(msg.sender, depositForDApp, percentage);
    badons.transferFrom(msg.sender, lot.lender, totalBadons);

    parkingLotLend.mint(msg.sender, lot.targetId);

    emit LotBorrowed(msg.sender, lot.lender, totalBadons);
  }

  function redeemLot(uint256 _tokenId) public nonReentrant {
    Lot storage lot = lots[_tokenId];
    if (lot.borrower == address(0)) revert NotForLoan();
    if (lot.endTime >= block.timestamp) revert NotExpired();

    parkingLotLend.burn(_tokenId);

    address lender = lot.lender;

    delete lots[_tokenId];

    parkingLot.safeTransferFrom(address(this), lender, _tokenId, "");

    emit LotRedeemed(msg.sender, _tokenId);
  }

  function beforeTransferHookParking(
    address _from,
    address _to,
    uint256 _tokenId
  ) external view {
    if (msg.sender != address(parkingLotLend)) revert Unauthorized();
    if (_from == address(0)) return;

    Lot memory lot = lots[_tokenId];

    if (
      !_allowedReceivers.contains(_to) &&
      _to != lot.borrower &&
      _to != address(0)
    ) revert Unauthorized();

    if (lot.daysOfPeriod == 0 && lot.hoursOfPeriod == 0) revert InvalidAction();

    if (
      lot.endTime < block.timestamp &&
      (_to != lot.borrower && _to != address(0))
    ) revert Expired();
  }

  function afterTransferHookParking(
    address,
    address _to,
    uint256 _tokenId
  ) external {
    if (msg.sender != address(parkingLotLend)) revert Unauthorized();

    Lot memory lot = lots[_tokenId];

    if (lot.endTime < block.timestamp && _to == lot.borrower) {
      redeemLot(_tokenId);
    }
  }

  function getLotUri(uint256 _tokenId) external view returns (string memory) {
    return parkingLot.tokenURI(_tokenId);
  }

  function isLotInMarket(uint256 _tokenId) external view returns (Lot memory) {
    return lots[_tokenId];
  }

  function modifyAllowedReceivers(
    address _receiver,
    bool _add
  ) external onlyOwner {
    if (_add) {
      _allowedReceivers.add(_receiver);
    } else {
      _allowedReceivers.remove(_receiver);
    }

    emit AllowedReceiverModified(_receiver, _add);
  }

  function onERC721Received(
    address _operator,
    address,
    uint256,
    bytes calldata
  ) external view returns (bytes4) {
    if (_operator != address(this)) revert Unauthorized();
    return this.onERC721Received.selector;
  }

  function setBadonsPercentageForDApp(
    uint16 _newPercentage
  ) external onlyOwner {
    if (_newPercentage > 1_000) {
      revert InvalidPercentage();
    }

    badonsPercentageForDApp = _newPercentage;

    emit SetBadonsPercentageForDApp(_newPercentage);
  }

  function setDepositForDApp(address _newDepositForDApp) external onlyOwner {
    if (_newDepositForDApp == address(0)) {
      revert AddressZero();
    }
    depositForDApp = _newDepositForDApp;
    emit SetDepositForDApp(_newDepositForDApp);
  }
}
