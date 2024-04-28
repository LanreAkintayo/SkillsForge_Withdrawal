# FundsLock (Withdrawal) Contract

## PRE-REQUISITE

- The framework used for the project is Hardhat.
- After cloning or pulling from this repo, enter the command `npm install ` in the terminal to install all dependencies used for this project
- Make sure your .env file is set up with all the necessary keys and endpoints needed. The template is shown below;

```
MNEMONIC=app boy spoon father mother ship monitor key type row column random
SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/<API_KEY>
SEPOLIA_API_KEY=<API_KEY>
```

- Note that the mnemonic provided above is just a sample as it does not subject the project to any form of exploitation. The tester should provide their own mnemonic.
- Note that the smart contract is deployed in **SEPOLIA TESTNET**. Hence, sepolia faucet will be needed in testing the smart contract. Faucet can be gotten in the following links below;
    <ul>
    <li>https://www.alchemy.com/faucets/ethereum-sepolia</li>
    <li>https://chainstack.com/sepolia-faucet/</li>
    <li>https://www.sepoliafaucet.io/</li>
    </ul>

- All the items that have been listed are to be set up to ensure smooth running of the program

## CONTRACT DETAILS

Contract Address: 0xb2eF98BB03a26fc7b46BEa6018800b654F932275<br/>
Link: https://sepolia.etherscan.io/address/0xb2eF98BB03a26fc7b46BEa6018800b654F932275<br/>
Demo Link: https://youtu.be/XrPzm1yWGBI

## COMPILATION

Enter the command shown below to compile your solidity code

```
npx hardhat compile
```

## DEPLOYMENT

The script `01-deploy-fundslock.ts` under the deploy directory is the one deploying the smart contract.<br/>
Enter the command shown below to deploy the smart contract to sepolia test network

```
npx hardhat deploy --tags "fundsLock" --network sepolia
```

OR<br/>
If any issue is encountered while trying to deploy with hardhat, REMIX is an alternative. It can be deployed with REMIX 👉👉 https://remix.ethereum.org/

# RUNNING TESTS

The test file can be found in **test\unit\FundsLock.test.ts**. The test file has four categories of test;

- Test for the depositFunds() function in the smart contract. The deposit function allows users to deposit ETH in the smart contract. To run that particular test, type the command below in the terminal

```
npx hardhat test --grep "should be able to deposit funds and set duration"
```

- Test for the depositFundsWithInterval() function in the smart contract. The depositWithInterval function allows users to set multiple withdrawal intervals for different portions of their deposited funds

```
npx hardhat test --grep "should be able to deposit funds with interval"
```

- Test for the withdrawFunds() function. The withdrawFunds()function allows users to withdraw the funds that they've already deposited. The smart contract is designed in a way that every deposited funds has a unique ID. The ID serves as a means of tracking the status of the funds. The command below can be used to run this test;

```
npx hardhat test --grep "should be able to withdraw after deposit"
```

- Test for the interest distribution mechanism. This is to ensure that if users withdraw their funds after a long period of time, interest would have been made on that fund. The command below can be used to run this test;

```
npx hardhat test --grep "should be able to earn interest if withdrawn late"
```

- The setInterests() function can only be called by the deployer of the contract. This function sets the interests that will be made based on how long funds are locked.

- Note that the test is using hardhat test network. This is to ensure faster execution and to save gas.

## RUNNING SCRIPTS

The scripts are located in the scripts directory. 1 script is written; <br/>

1. verifyFunsdLock.ts <br/>
   This script is used to verify the contract in the sepolia block explorer

```
npx hardhat run scripts/verifyFundsLock.ts --network sepolia
```
