// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FeeRequired} from "./FeeRequired.sol";
import {TokenPayable} from "./TokenPayable.sol";

contract TokenLink is Ownable, TokenPayable, FeeRequired {
    error HashCollision();
    error OtpIncorrect();

    struct PayRecord {
        address erc20Address;
        uint amount;
    }

    // 存款用户 + 密码映射到存款币种和金额
    mapping(address => mapping(bytes32 => PayRecord)) private payRecordMap;

    constructor(
        address initialOwner,
        address feeMaster
    ) Ownable(initialOwner) FeeRequired(feeMaster) {}

    /**
     *
     * （合约拥有人）设置手续费管理合约
     *
     * @param feeMaster 手续费管理合约地址
     */
    function setFeeMaster(address feeMaster) public onlyOwner {
        _setFeeMaster(feeMaster);
    }

    /**
     *
     * （需要ERC20预授信）将预授信的ERC20代币存入当前合约，并指定提款密码
     *
     * @param erc20Address ERC20代币合约地址
     * @param amount 存入金额
     * @param otpHash keccak256哈希后的密码
     */
    function deposit(
        address erc20Address,
        uint amount,
        bytes32 otpHash
    ) public receiver(erc20Address, amount) {
        // 为了节约存储空间，存款密码是存款记录的唯一键，所以同一个用户使用相同密码，抛出密码冲突异常
        if (payRecordMap[msg.sender][otpHash].erc20Address != address(0)) {
            revert HashCollision();
        }

        // 计算并支付手续费
        (uint fee, ) = collectFee(erc20Address, amount);

        // 插入存款记录
        payRecordMap[msg.sender][otpHash] = PayRecord(
            erc20Address,
            amount - fee
        );
    }

    /**
     *
     * 使用提款密码提取指定用户预存的代币
     *
     * @param owner 预存款人钱包地址
     * @param otp 提款密码
     */
    function withdraw(address owner, string calldata otp) public {
        bytes32 otpHash = keccak256(abi.encodePacked(otp));
        mapping(bytes32 => PayRecord) storage ownerPayRecord = payRecordMap[
            owner
        ];
        PayRecord storage payRecord = ownerPayRecord[otpHash];

        // 输入密码keccak256哈希后找不到存款记录，表明密码错误
        if (payRecord.erc20Address == address(0)) {
            revert OtpIncorrect();
        }

        // 从存款记录获取预存金额，从当前合约转账对应金额给合约调用者
        _transfer(msg.sender, payRecord.erc20Address, payRecord.amount);

        // 金额已提取，删除存款记录
        delete ownerPayRecord[otpHash];
    }

    /**
     *
     * （合约拥有人）使用提款密码返还预存代币给预存款人
     *
     * @param owner 预存款人钱包地址
     * @param otp 提款密码
     */
    function revoke(address owner, string calldata otp) public onlyOwner {
        bytes32 otpHash = keccak256(abi.encodePacked(otp));
        mapping(bytes32 => PayRecord) storage ownerPayRecord = payRecordMap[
            owner
        ];
        PayRecord storage payRecord = ownerPayRecord[otpHash];

        // 输入密码keccak256哈希后找不到存款记录，表明密码错误
        if (payRecord.erc20Address == address(0)) {
            revert OtpIncorrect();
        }

        // 从存款记录获取预存代币，从当前合约转账对应代币给预存款人
        _transfer(owner, payRecord.erc20Address, payRecord.amount);

        // 金额已返还，删除存款记录
        delete ownerPayRecord[otpHash];
    }
}
