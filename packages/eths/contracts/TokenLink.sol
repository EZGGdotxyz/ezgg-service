// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FeeRequired.sol";
import "./FeeMaster.sol";
import "./TokenPayable.sol";

contract TokenLink is Ownable, TokenPayable, FeeRequired, ReentrancyGuard {
    event LinkDeposit(
        string indexed txCode,
        uint256 time,
        address from,
        address to,
        address erc20,
        uint amount
    );

    event LinkWithdraw(
        string indexed txCode,
        uint256 time,
        address from,
        address to,
        address erc20,
        uint amount
    );

    event LinkRevoke(
        string indexed txCode,
        uint256 time,
        address from,
        address to,
        address erc20,
        uint amount
    );

    error HashCollision();
    error OtpIncorrect();

    struct PayRecord {
        IERC20 erc20;
        uint amount;
    }

    // 存款用户 + 密码映射到存款币种和金额
    mapping(address => mapping(bytes32 => PayRecord)) private payRecordMap;

    constructor(
        address initialOwner,
        FeeMaster feeMaster
    ) Ownable(initialOwner) FeeRequired(feeMaster) {}

    /**
     *
     * （合约拥有人）设置手续费管理合约
     *
     * @param feeMaster 手续费管理合约地址
     */
    function setFeeMaster(FeeMaster feeMaster) public onlyOwner {
        _setFeeMaster(feeMaster);
    }

    /**
     * （需要ERC20预授信）支付合约手续费
     *
     * @param txCode 应用服务端生成的交易代码
     * @param erc20 ERC20代币合约
     * @param amount 支付金额
     */
    function payFee(
        string calldata txCode,
        IERC20 erc20,
        uint amount
    ) public onlyAllowance(erc20, amount) feeCollector(txCode, erc20, amount) {
        _transferFrom(msg.sender, feeReceiver(), erc20, amount);
    }

    /**
     *
     * （需要ERC20预授信）将预授信的ERC20代币存入当前合约，并指定提款密码，需要先调用payFee支付手续费
     *
     * @param txCode 应用服务端生成的交易代码
     * @param erc20 ERC20代币合约
     * @param amount 存入金额
     * @param otpHash keccak256哈希后的密码
     */
    function deposit(
        string calldata txCode,
        IERC20 erc20,
        uint amount,
        bytes32 otpHash
    ) public receiver(erc20, amount) transactional(txCode) {
        // 为了节约存储空间，存款密码是存款记录的唯一键，所以同一个用户使用相同密码，抛出密码冲突异常
        if (address(payRecordMap[msg.sender][otpHash].erc20) != address(0)) {
            revert HashCollision();
        }

        // 插入存款记录
        payRecordMap[msg.sender][otpHash] = PayRecord(erc20, amount);

        emit LinkDeposit(
            txCode,
            block.timestamp,
            msg.sender,
            address(this),
            address(erc20),
            amount
        );
    }

    /**
     *
     * 使用提款密码提取指定用户预存的代币
     *
     * @param txCode 应用服务端生成的交易代码
     * @param owner 预存款人钱包地址
     * @param otp 提款密码
     */
    function withdraw(
        string calldata txCode,
        address owner,
        string calldata otp
    ) public nonReentrant {
        bytes32 otpHash = keccak256(abi.encodePacked(otp));
        mapping(bytes32 => PayRecord) storage ownerPayRecord = payRecordMap[
            owner
        ];
        PayRecord storage payRecord = ownerPayRecord[otpHash];

        // 输入密码keccak256哈希后找不到存款记录，表明密码错误
        if (address(payRecord.erc20) == address(0)) {
            revert OtpIncorrect();
        }

        // 从存款记录获取预存金额，从当前合约转账对应金额给合约调用者
        _transfer(msg.sender, payRecord.erc20, payRecord.amount);

        // 金额已提取，删除存款记录
        delete ownerPayRecord[otpHash];

        emit LinkWithdraw(
            txCode,
            block.timestamp,
            address(this),
            msg.sender,
            address(payRecord.erc20),
            payRecord.amount
        );
    }

    /**
     *
     * （合约拥有人）使用提款密码返还预存代币给预存款人
     *
     * @param txCode 应用服务端生成的交易代码
     * @param owner 预存款人钱包地址
     * @param otp 提款密码
     */
    function revoke(
        string calldata txCode,
        address owner,
        string calldata otp
    ) public onlyOwner nonReentrant {
        bytes32 otpHash = keccak256(abi.encodePacked(otp));
        mapping(bytes32 => PayRecord) storage ownerPayRecord = payRecordMap[
            owner
        ];
        PayRecord storage payRecord = ownerPayRecord[otpHash];

        // 输入密码keccak256哈希后找不到存款记录，表明密码错误
        if (address(payRecord.erc20) == address(0)) {
            revert OtpIncorrect();
        }

        // 从存款记录获取预存代币，从当前合约转账对应代币给预存款人
        _transfer(owner, payRecord.erc20, payRecord.amount);

        // 金额已返还，删除存款记录
        delete ownerPayRecord[otpHash];

        emit LinkWithdraw(
            txCode,
            block.timestamp,
            address(this),
            owner,
            address(payRecord.erc20),
            payRecord.amount
        );
    }
}
