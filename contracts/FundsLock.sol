// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import  "@openzeppelin/contracts/access/Ownable.sol";

contract FundsLock is ReentrancyGuard, Ownable {

    error FundsLock__ZeroValue();
    error FundsLock__BalanceExceeded();
    error FundsLock__InvalidArgs();
    error FundsLock__InsufficientFunds();
    error FundsLock__DepositNotFound();
    error FundsLock__DepositNotForCaller();
    error FundsLock__FundsStillLockUp();
    error FundsLock__InsufficientFundsInReserve();
    error FundsLock__FundsWithdrawFailed();
    error FundsLock__AlreadyWithdrawn();

    event FundsDepositedWithInterval(address indexed depositor, uint256[] indexed amount, uint256[] indexed duration);
    event FundsDeposited(address indexed depositor, uint256 indexed amount, uint256 indexed duration);
    event InterestsSet(uint256[] indexed durations, uint256[] indexed interests);
    event FundsWithdrawn(bytes16 indexed depositId, uint256 indexed totalFunds);


    struct DepositInfo {
        address depositor;
        uint256 amount;
        uint256 depositTime;
        uint256 duration;
        bool claim;
        bytes16 id;
    }

    mapping(bytes16 => DepositInfo) private s_userFunds;
    mapping(uint256 => uint256) private s_durationToInterest;   // You earn interest based on how long your funds is locked up
    mapping(address => bytes16[]) private s_allUserDeposits;

    uint256[] private s_durations;
    uint256[] private s_interestPercentages;

    uint256 private s_idGenerator = 0;

    uint256 private constant AMOUNT_PRECISION = 10_000; // For better percentage precision

     fallback() external payable {
    }

    receive() external payable {
    }

    /**
     * @notice A function that sets the duration and its corresponding interest. Only the owner can call this function
     * @param durations  This is an array of the durations (in seconds)
     * @param interests  This is an array of the interests (every percentage is multiplied by 100 for better precision) 
     */
    function setInterests(uint256[] memory durations, uint256[] memory interests) external onlyOwner {
        if (durations.length != interests.length){
            revert FundsLock__InvalidArgs();
        }

        delete s_durations;
        delete s_interestPercentages;

        for (uint i = 0; i < durations.length; i++){
            s_durations.push(durations[i]);
            s_interestPercentages.push(interests[i]);
        }

        emit InterestsSet(durations, interests);
    }

      /**
     * @notice A function that users call to deposit funds (ETH) into the contract.
     * @param duration  This specifies how long the funds should be locked in the contract (in seconds)
     */
    function depositFunds(uint256 duration) external payable nonReentrant{
        uint256 amount = msg.value;
        if (amount <= 0 || duration <= 0){
            revert FundsLock__ZeroValue();
        }

        if (amount > msg.sender.balance){
            revert FundsLock__BalanceExceeded();
        }

        bytes16 depositId = _generateDepositID(msg.sender);

         DepositInfo memory newDepositInfo = DepositInfo({
                depositor: msg.sender,
                amount: amount,
                depositTime: block.timestamp,
                duration: duration,
                claim: false,
                id: depositId
            });

        s_allUserDeposits[msg.sender].push(depositId);
        s_userFunds[depositId] = newDepositInfo;
        s_idGenerator++;

        emit FundsDeposited(msg.sender, amount, duration);
    }

      /**
     * @notice A function that allows users to set multiple withdrawal intervals for different portions of their deposited funds
     * @param amount  This is an array of the amount to deposit
     * @param duration  This is an array of the withdrawal intervals (in seconds)
     */
    function depositFundsWithInterval(uint256[] memory amount, uint256[] memory duration) external payable nonReentrant {
        if (amount.length != duration.length){
            revert FundsLock__InvalidArgs();
        }

        uint256 totalAmount = getTotalAmount(amount);

        if (totalAmount > msg.value){
            revert FundsLock__InsufficientFunds();
        }

        if (totalAmount > msg.sender.balance){
            revert FundsLock__BalanceExceeded();
        }

        for (uint i = 0; i < amount.length; i++){
            uint256 currentAmount = amount[i];
            uint256 currentDuration = duration[i];
            bytes16 depositId = _generateDepositID(msg.sender);

            DepositInfo memory newDepositInfo = DepositInfo({
                depositor: msg.sender,
                amount: currentAmount,
                depositTime: block.timestamp,
                duration: currentDuration,
                claim: false,
                id: depositId
            });

            s_allUserDeposits[msg.sender].push(depositId);
            s_userFunds[depositId] = newDepositInfo;
            s_idGenerator++;
        }
        emit FundsDepositedWithInterval(msg.sender, amount, duration);

    }

    /**
     * @notice This is a function called by the users to withdraw their deposited funds.
     * @param depositId This is a uniqueId that specifies the funds to be withdrawn. Every deposited funds have their unique Id
     */
    function withdrawFunds(bytes16 depositId) external nonReentrant{
        DepositInfo memory depositInfo = s_userFunds[depositId];
        if (depositInfo.depositor == address(0)){
            revert FundsLock__DepositNotFound();
        }
        if (depositInfo.depositor != msg.sender){
            revert FundsLock__DepositNotForCaller();
        }
        if (depositInfo.claim == true){
            revert FundsLock__AlreadyWithdrawn();
        }
        if (block.timestamp < depositInfo.depositTime + depositInfo.duration){
            revert FundsLock__FundsStillLockUp();
        }

        uint256 interest = getInterest(depositInfo.amount, depositInfo.depositTime);

        uint256 totalFunds = depositInfo.amount + interest;

        if (address(this).balance < totalFunds){
            revert FundsLock__InsufficientFundsInReserve();
        }
        s_userFunds[depositId].claim = true;

        // Send the funds to the depositor 
        (bool success,) = msg.sender.call{value: totalFunds}("");
        if (!success){
            revert FundsLock__FundsWithdrawFailed();
        }

        emit FundsWithdrawn(depositId, totalFunds);

    }

       /**
     * @notice This function converts an unsigned integer to a bytes16 value
     * @param x This specifies the unsigned integer to convert.
     * @return b This is the bytes conversion of the unsigned integer
     */
    function _toBytes16(uint256 x) internal pure returns (bytes16 b) {
        return bytes16(bytes32(x));
    }

       /**
     * @notice This function generates an ID based on the parameters passed to it
     * @param w This is an address of the user depositing funds
     * @param x This is the id generator that gets incremented anytime a deposit is detected
     * @param y This is the time the deposit is made
     * @param z This is a byte value that contributes to generating the ID
     * @return b This is the ID returned
     */
    function _generateID(
        address w,
        uint256 x,
        uint256 y,
        bytes1 z) internal pure returns (bytes16 b) {
        b = _toBytes16(uint256(keccak256(abi.encodePacked(w, x, y, z))));
    }

       /**
     * @notice This generates the deposit ID
     * @param _user This is the address of the depositor
     * @return depositId This is the deposit Id
     */
    function _generateDepositID(address _user) internal view returns (bytes16 depositId){
        return _generateID( _user, s_idGenerator, block.timestamp, 0x01);
    }

       /**
     * @notice This function returns the accumulation of all the amount passed in the array
     * @param amount This is an array of the amounts to be accumulated
     * @return uint256 The accumulated value is returned
     */
    function getTotalAmount(uint256[] memory amount) public pure returns(uint256){
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amount.length; i++){
            totalAmount += amount[i];
        }
        return totalAmount;
    } 

       /**
     * @notice Calculates interest based on the amount and the time it was deposited
     * @param amount This specifies the amount to calculate interest on
     * @param depositTime This specifies the time the amount was deposited
     * @return the interest
     */
    function getInterest(uint256 amount, uint256 depositTime) public view returns(uint256){
        uint256 timeElapsed = block.timestamp - depositTime;
        uint256 interest = 0;

        for (int256 index = int(s_durations.length - 1); index >= 0; index--){
            uint256 i = uint256(index);
            uint256 currentDuration = s_durations[i];
        
            if (timeElapsed >= currentDuration){
                interest = (s_interestPercentages[i] * amount) / AMOUNT_PRECISION;
                break;
            }
        }  

        return interest;
    }

       /**
     * @notice Gets all the ids of the deposited funds of the user
     * @param user This specifies the user that needs to obtain the ids
     * @return an array of all the ids
     */
    function getUserDepositIds(address user) external view returns(bytes16[] memory){
        return s_allUserDeposits[user];
    }

       /**
     * @notice Gets the details of a deposit specified by the depositId
     * @param depositId This is the ID that the details needs to be obtained
     * @return the details of the deposited funds
     */
    function getUserDeposit(bytes16 depositId) external view returns(DepositInfo memory){
        return s_userFunds[depositId];
    }

}

