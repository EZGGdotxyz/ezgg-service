import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("TokenTransfer", function () {
  async function deployMockToken() {
    const [owner, playerA, playerB] = await hre.viem.getWalletClients();

    const feeMaster = await hre.viem.deployContract<string>("FeeMaster", [
      owner.account.address,
    ]);

    const transfer = await hre.viem.deployContract<string>("TokenTransfer", [
      owner.account.address,
      feeMaster.address,
    ]);
    const mockToken = await hre.viem.deployContract<string>("ERC20MockToken");

    const transfer4PlayerA = await hre.viem.getContractAt<string>(
      "TokenTransfer",
      transfer.address,
      { client: { wallet: playerA } }
    );
    const transfer4PlayerB = await hre.viem.getContractAt<string>(
      "TokenTransfer",
      transfer.address,
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
      transfer,
      mockToken,
      owner,
      player: [
        {
          wallet: playerA,
          transfer: transfer4PlayerA,
          token: mockToken4PlayerA,
        },
        {
          wallet: playerB,
          transfer: transfer4PlayerB,
          token: mockToken4PlayerB,
        },
      ],
    };
  }

  describe("transfer", function () {
    it("Should TokenTransfer receive amount equal deposit amount", async function () {
      const {
        transfer,
        mockToken,
        player: [playerA, playerB],
      } = await loadFixture(deployMockToken);

      const txCode = "GwXWy3fHYNhMonOQfGrzakeOQNSMjuXl";

      const balanceBefore = (await mockToken.read.balanceOf([
        playerA.wallet.account.address,
      ])) as bigint;

      const amount = 100n;
      const fee = 10n;
      await playerA.token.write.approve([transfer.address, amount + fee]);
      await playerA.transfer.write.payFee([txCode, mockToken.address, fee]);
      await playerA.transfer.write.transfer([
        txCode,
        playerB.wallet.account.address,
        mockToken.address,
        amount,
      ]);

      const balanceAfter = (await mockToken.read.balanceOf([
        playerA.wallet.account.address,
      ])) as bigint;

      expect(balanceBefore - balanceAfter).to.eq(amount + fee);
      expect(
        await mockToken.read.balanceOf([playerB.wallet.account.address])
      ).to.eq(amount);
    });
  });
});
