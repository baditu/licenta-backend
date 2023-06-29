//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

struct Lot {
  uint32 targetId;
  bool borrowed;
  address borrower;
  address lender;
  uint256 daysOfPeriod;
  uint256 hoursOfPeriod;
  uint256 startTime;
  uint256 endTime;
  uint256 badonsPerPeriod;
}

struct ListedLot {
  uint256 tokenId;
  address owner;
  uint256 price;
  bool listed;
}