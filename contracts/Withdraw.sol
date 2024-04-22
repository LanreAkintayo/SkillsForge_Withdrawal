// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./PublicTimedCrowdsale.sol";
import "./PublicCappedCrowdsale.sol";
import "./PublicPostDeliveryCrowdsale.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract PublicCbnSale is PublicPostDeliveryCrowdsale {

    IERC20 private catBank;
    
    error PublicCbnSale__CrowdsaleNotClosed();

    event SaleConcluded(address owner, uint256 cbnAmount);


    constructor(
            uint256 rate,
            uint256 minAmount,
            uint256 maxAmount,
            uint16 rewardPercentage,
            address payable wallet,
            IERC20 token,
            uint256 openingTime,
            uint256 closingTime,
            uint cap
    ) PublicCrowdsale(rate, rewardPercentage,minAmount, maxAmount, wallet, token) PublicTimedCrowdsale(openingTime, closingTime) PublicCappedCrowdsale(cap) {
        catBank = token;
    }


    function concludeSale(uint amount) external onlyOwner {

        if (!hasClosed()){
            revert PublicCbnSale__CrowdsaleNotClosed();
        }
      
        catBank.transfer(msg.sender, amount);

        emit SaleConcluded(msg.sender, amount);
    }
   
}

