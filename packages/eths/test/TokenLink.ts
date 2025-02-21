import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

describe("TokenLink", function () {
  async function deployMockToken() {
    const [owner, playerA, playerB] = await hre.viem.getWalletClients();

    const feeMaster = await hre.viem.deployContract<string>("FeeMaster", [
      owner.account.address,
    ]);

    const tokenLink = await hre.viem.deployContract<string>("TokenLink", [
      owner.account.address,
      feeMaster.address,
    ]);
    const mockToken = await hre.viem.deployContract<string>("ERC20MockToken");

    const tokenLink4PlayerA = await hre.viem.getContractAt<string>(
      "TokenLink",
      tokenLink.address,
      { client: { wallet: playerA } }
    );
    const tokenLink4PlayerB = await hre.viem.getContractAt<string>(
      "TokenLink",
      tokenLink.address,
      { client: { wallet: playerB } }
    );

    const mockToken4PlayerA = await hre.viem.getContractAt<string>(
      "ERC20MockToken",
      mockToken.address,
      { client: { wallet: playerA } }
    );
    mockToken4PlayerA.write.airdrop([1000]);

    const mockToken4PlayerB = await hre.viem.getContractAt<string>(
      "ERC20MockToken",
      mockToken.address,
      { client: { wallet: playerB } }
    );

    return {
      feeMaster,
      tokenLink,
      mockToken,
      owner,
      player: [
        {
          wallet: playerA,
          tokenLink: tokenLink4PlayerA,
          token: mockToken4PlayerA,
        },
        {
          wallet: playerB,
          tokenLink: tokenLink4PlayerB,
          token: mockToken4PlayerB,
        },
      ],
    };
  }

  describe("deposit", function () {
    it("Should TokenLink receive amount equal deposit amount", async function () {
      const {
        tokenLink,
        mockToken,
        player: [playerA, playerB],
      } = await loadFixture(deployMockToken);

      const balanceBefore = (await mockToken.read.balanceOf([
        playerA.wallet.account.address,
      ])) as bigint;

      const amount = 100n;
      const otpHash = keccak256(toUtf8Bytes("123456"));
      await playerA.token.write.approve([tokenLink.address, amount]);
      await playerA.tokenLink.write.deposit([
        mockToken.address,
        amount,
        otpHash,
      ]);

      const balanceAfter = (await mockToken.read.balanceOf([
        playerA.wallet.account.address,
      ])) as bigint;

      expect(balanceBefore - balanceAfter).to.eq(amount);
      expect(await mockToken.read.balanceOf([tokenLink.address])).to.eq(amount);
    });

    it("Should revert HashCollision error, if used same otp", async function () {
      const {
        tokenLink,
        mockToken,
        player: [playerA],
      } = await loadFixture(deployMockToken);

      const deposit = async () => {
        const amount = 100;
        const otpHash = keccak256(toUtf8Bytes("123456"));
        await playerA.token.write.approve([tokenLink.address, amount]);
        await playerA.tokenLink.write.deposit([
          mockToken.address,
          amount,
          otpHash,
        ]);
      };
      await deposit();
      await expect(deposit()).to.revertedWithCustomError(
        tokenLink,
        "HashCollision"
      );
    });

    it("Should revert AmountIncorrect error, if amount less or equal zero", async function () {
      const {
        tokenLink,
        mockToken,
        player: [playerA],
      } = await loadFixture(deployMockToken);

      const amount = 0;
      const otpHash = keccak256(toUtf8Bytes("123456"));
      await playerA.token.write.approve([tokenLink.address, amount]);
      await expect(
        playerA.tokenLink.write.deposit([mockToken.address, amount, otpHash])
      ).to.revertedWithCustomError(tokenLink, "AmountIncorrect");
    });

    it("Should revert AllowanceRequire error, if not approve token before invoke contract", async function () {
      const {
        tokenLink,
        mockToken,
        player: [playerA],
      } = await loadFixture(deployMockToken);

      const otpHash = keccak256(toUtf8Bytes("123456"));
      await expect(
        playerA.tokenLink.write.deposit([mockToken.address, 100, otpHash])
      ).to.revertedWithCustomError(tokenLink, "AllowanceRequire");
    });
  });

  describe("withdraw", function () {
    it("Should withdraw amount equal deposit amount", async function () {
      const {
        tokenLink,
        mockToken,
        player: [playerA, playerB],
      } = await loadFixture(deployMockToken);

      const amount = 100;
      const otp = "123456";
      const otpHash = keccak256(toUtf8Bytes(otp));
      await playerA.token.write.approve([tokenLink.address, amount]);
      await playerA.tokenLink.write.deposit([
        mockToken.address,
        amount,
        otpHash,
      ]);

      const balanceBefore = (await mockToken.read.balanceOf([
        playerB.wallet.account.address,
      ])) as bigint;
      await playerB.tokenLink.write.withdraw([
        playerA.wallet.account.address,
        otp,
      ]);
      const balanceAfter = (await mockToken.read.balanceOf([
        playerB.wallet.account.address,
      ])) as bigint;
      expect(balanceAfter - balanceBefore).to.eq(amount);
    });

    it("Should revert OtpIncorrect error, if OTP incorrect", async function () {
      const {
        tokenLink,
        mockToken,
        player: [playerA, playerB],
      } = await loadFixture(deployMockToken);

      const amount = 100;
      const otpHash = keccak256(toUtf8Bytes("123456"));
      await playerA.token.write.approve([tokenLink.address, amount]);
      await playerA.tokenLink.write.deposit([
        mockToken.address,
        amount,
        otpHash,
      ]);

      await expect(
        playerB.tokenLink.write.withdraw([
          playerA.wallet.account.address,
          "654321",
        ])
      ).to.be.revertedWithCustomError(tokenLink, "OtpIncorrect");
    });

    it("Should revert OtpIncorrect error, if withdraw with same OTP more than 1 times", async function () {
      const {
        tokenLink,
        mockToken,
        player: [playerA, playerB],
      } = await loadFixture(deployMockToken);

      const amount = 100;
      const otp = "123456";
      const otpHash = keccak256(toUtf8Bytes(otp));
      await playerA.token.write.approve([tokenLink.address, amount]);
      await playerA.tokenLink.write.deposit([
        mockToken.address,
        amount,
        otpHash,
      ]);

      await playerB.tokenLink.write.withdraw([
        playerA.wallet.account.address,
        otp,
      ]);
      await expect(
        playerB.tokenLink.write.withdraw([playerA.wallet.account.address, otp])
      ).to.revertedWithCustomError(tokenLink, "OtpIncorrect");
    });
  });

  describe("revoke", function () {
    it("Should only owner can invoke", async function () {
      const {
        owner,
        mockToken,
        tokenLink,
        player: [playerA],
      } = await loadFixture(deployMockToken);

      const tokenLink4Owner = await hre.viem.getContractAt<string>(
        "TokenLink",
        tokenLink.address,
        { client: { wallet: owner } }
      );

      const amount = 100;
      const otp = "123456";
      const otpHash = keccak256(toUtf8Bytes(otp));
      await playerA.token.write.approve([tokenLink.address, amount]);
      await playerA.tokenLink.write.deposit([
        mockToken.address,
        amount,
        otpHash,
      ]);

      const depositPlayerAddress = playerA.wallet.account.address;
      await expect(
        playerA.tokenLink.write.revoke([depositPlayerAddress, otp])
      ).to.revertedWithCustomError(tokenLink, "OwnableUnauthorizedAccount");

      const balanceBefore = (await mockToken.read.balanceOf([
        depositPlayerAddress,
      ])) as bigint;

      await tokenLink4Owner.write.revoke([depositPlayerAddress, otp]);

      const balanceAfter = (await mockToken.read.balanceOf([
        depositPlayerAddress,
      ])) as bigint;

      expect(balanceAfter - balanceBefore).to.eq(amount);
    });

    it("Should revert OtpIncorrect error, if OTP incorrect", async function () {
      const {
        owner,
        tokenLink,
        mockToken,
        player: [playerA],
      } = await loadFixture(deployMockToken);

      const tokenLink4Owner = await hre.viem.getContractAt<string>(
        "TokenLink",
        tokenLink.address,
        { client: { wallet: owner } }
      );

      const amount = 100;
      const otpHash = keccak256(toUtf8Bytes("123456"));
      await playerA.token.write.approve([tokenLink.address, amount]);
      await playerA.tokenLink.write.deposit([
        mockToken.address,
        amount,
        otpHash,
      ]);

      await expect(
        tokenLink4Owner.write.revoke([playerA.wallet.account.address, "654321"])
      ).to.be.revertedWithCustomError(tokenLink, "OtpIncorrect");
    });

    it("Should revert OtpIncorrect error, if revoke with same OTP more than 1 times", async function () {
      const {
        owner,
        tokenLink,
        mockToken,
        player: [playerA],
      } = await loadFixture(deployMockToken);

      const tokenLink4Owner = await hre.viem.getContractAt<string>(
        "TokenLink",
        tokenLink.address,
        { client: { wallet: owner } }
      );

      const depositPlayerAddress = playerA.wallet.account.address;
      const amount = 100;
      const otp = "123456";
      const otpHash = keccak256(toUtf8Bytes(otp));
      await playerA.token.write.approve([tokenLink.address, amount]);
      await playerA.tokenLink.write.deposit([
        mockToken.address,
        amount,
        otpHash,
      ]);

      await tokenLink4Owner.write.revoke([depositPlayerAddress, otp]);
      await expect(
        tokenLink4Owner.write.revoke([depositPlayerAddress, otp])
      ).to.revertedWithCustomError(tokenLink, "OtpIncorrect");
    });
  });
});
