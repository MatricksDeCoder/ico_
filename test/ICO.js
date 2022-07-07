const { assert, expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { BigNumber } = require('ethers');
const { resourceLimits } = require("worker_threads");
const provider = waffle.provider;

describe("ICO", function () {
  const taxRate = 2;
  const rate = 5;
  const cap = ethers.utils.parseEther('500000') 
  const limitSeed = ethers.utils.parseEther('1500') 
  const limitGeneral = ethers.utils.parseEther('1000');
  const targetSeed = ethers.utils.parseEther('15000');
  const targetTotal = ethers.utils.parseEther('30000')
  let totalETHContributions = 0;
  let result;
  const contribution1 = ethers.utils.parseEther('500');
  const contribution3 = ethers.utils.parseEther('300');
  const excessContr =  ethers.utils.parseEther('2000');
  const contribution2 = ethers.utils.parseEther('0.5');
  const oneEther  = ethers.utils.parseEther('1');
  let ico;
  const notMint = cap-(targetTotal*rate)
  let tenAddresses
  let ICOFactory

  beforeEach(async function () {
    [deployer, treasury, whiteListed1, whiteListed2, user3, user4,...rest] = await ethers.getSigners();
    addresses = await ethers.getSigners()
    addresses2 = await ethers.getSigners()
    ICOFactory = await ethers.getContractFactory("SpaceCoin");
    ico = await ICOFactory.deploy(treasury.address);
    await ico.deployed()
    //whitelist users 1 and 2
    await ico.setWhitelist(whiteListed1.address, true);
    await ico.setWhitelist(whiteListed2.address, true);
  });

  describe("deployment", async function () {

    it("must have correct owner", async function () {
      result = await ico.owner();
      expect(result).to.equal(deployer.address);
    });

    it("must not be paused", async function () {
      result = await ico.isPaused();
      expect(result).to.equal(false);
    });

    it("must be taxable", async function () {
      result = await ico.isTaxable();
      expect(result).to.equal(true);
    });

    it("must have correct taxRate", async function () {
      result = await ico.taxRate();
      expect(result.toString()).to.equal(taxRate.toString());
    });

    it("must have correct exchange Rate", async function () {
      result = await ico.rate();
      expect(result.toString()).to.equal(rate.toString());
    });

    it("must have correct capped totalSupply", async function () {
      result = await ico.cap();
      expect(Number(result)).to.equal(Number(cap));
    });

    it("must have correct limit for Seed Phase", async function () {
      result = await ico.limitSeed();
      expect(Number(result)).to.equal(Number(limitSeed));
    });

    it("must have correct limit for General Phase", async function () {
      result = await ico.limitGeneral();
      expect(Number(result)).to.equal(Number(limitGeneral));
    });
   
    it("must have correct target ETH for General Phase", async function () {
      result = await ico.targetSeed();
      expect(Number(result)).to.equal(Number(targetSeed));
    });

    it("must have correct target ETH to raise in ICO", async function () {
      result = await ico.targetTotal();
      expect(Number(result)).to.equal(Number(targetTotal));
    });

    it("must start with zero ETH contributed", async function () {
      result = await ico.totalETHContributions();
      expect(Number(result)).to.equal(totalETHContributions);
    });

    it("must mint capped totalSupply less available for ICO to owner", async function () {
      result = await ico.balanceOf(deployer.address);
      expect(Number(result)).to.equal(Number(notMint));
    });

    it("testing ICO must start with correct whitelistings", async function () {
      result = await ico.isWhitelisted(whiteListed1.address);
      expect(result).to.equal(true);
      result = await ico.isWhitelisted(whiteListed2.address);
      expect(result).to.equal(true);
      result = await ico.isWhitelisted(user3.address);
      expect(result).to.equal(false);
      result = await ico.isWhitelisted(user4.address);
      expect(result).to.equal(false);
    }); 

    it("must start with all users not having any contributions", async function () {
      result = await ico.contributions(whiteListed1.address);
      expect(result).to.equal(0);
      result = await ico.contributions(whiteListed2.address);
      expect(result).to.equal(0);
      result = await ico.contributions(user3.address);
      expect(result).to.equal(0);
      result = await ico.contributions(user4.address);
      expect(result).to.equal(0);
    });

  });

  describe("setTaxable()", async function () {
    it("should revert if setter is not owner -setting true", async function () {
      await expect(ico.connect(whiteListed1).setTaxable(true)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
    it("should revert if setter is not owner - setting false", async function () {
      await expect(ico.connect(whiteListed1).setTaxable(false)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
    it("should allow creator to set Taxable -setting false", async function () {
      await ico.connect(deployer).setTaxable(false);
      result = await ico.isTaxable()
      expect(result).to.equal(false);
    });
    it("should allow creator to set Taxable -setting true if was false", async function () {
      await ico.connect(deployer).setTaxable(false);
      result = await ico.isTaxable()
      expect(result).to.equal(false);
      await ico.connect(deployer).setTaxable(true);
      result = await ico.isTaxable()
      expect(result).to.equal(true);
    });
    it('emits event on Taxable setting false', async function () {
      await expect(ico.connect(deployer).setTaxable(false))
      .to.emit(ico, 'TaxableUpdated')
      .withArgs(false)
    })
    it('emits event on Taxable setting true', async function () {
      await expect(ico.connect(deployer).setTaxable(true))
      .to.emit(ico, 'TaxableUpdated')
      .withArgs(true)
    })
  });

  describe("setPauseStatus()", async function () {
    it("should revert if setter is not owner -setting true", async function () {
      await expect(ico.connect(whiteListed1).setPauseStatus(true)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
    it("should revert if setter is not owner - setting false", async function () {
      await expect(ico.connect(whiteListed1).setPauseStatus(false)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
    it("should allow creator to set Pause -setting false", async function () {
      await ico.connect(deployer).setPauseStatus(false);
      result = await ico.isPaused()
      expect(result).to.equal(false);
    });
    it("should allow creator to set Pause -setting true if was false", async function () {
      await ico.connect(deployer).setPauseStatus(false);
      await ico.connect(deployer).setPauseStatus(true);
      result = await ico.isPaused()
      expect(result).to.equal(true);
    });
    it('emits event on set Pause status setting true', async function () {
      await expect(ico.connect(deployer).setPauseStatus(true))
      .to.emit(ico, 'PauseUpdated')
      .withArgs(true)
    })
    it('emits event on set Pause status setting false', async function () {
      await expect(ico.connect(deployer).setPauseStatus(false))
      .to.emit(ico, 'PauseUpdated')
      .withArgs(false)
    })
  });

  describe("setWhitelist()", async function () {
    it("should revert if setter is not owner -setting true", async function () {
      await expect(ico.connect(whiteListed1).setWhitelist(user3.address,true)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
    it("should revert if setter is not owner - setting false", async function () {
      await expect(ico.connect(whiteListed1).setWhitelist(user3.address,false)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
    it("should allow creator to set Whitelist -setting false", async function () {
      await ico.connect(deployer).setWhitelist(whiteListed1.address, false);
      result =  await ico.isWhitelisted(whiteListed1.address);
      expect(result).to.equal(false);
    });
    it("should allow creator to set Whitelist -setting true if was false", async function () {
      await ico.connect(deployer).setWhitelist(user3.address, true);
      result =  await ico.isWhitelisted(user3.address);
      expect(result).to.equal(true);
    });
    it('emits event on set Whitelisst status setting true', async function () {
      await expect(ico.connect(deployer).setWhitelist(user3.address, true))
      .to.emit(ico, 'WhitelistUpdated')
      .withArgs(user3.address, true)
    })
    it('emits event on set Whitelisst status setting false', async function () {
      await expect(ico.connect(deployer).setWhitelist(user3.address, false))
      .to.emit(ico, 'WhitelistUpdated')
      .withArgs(user3.address, false)
    })
  });

  describe("setPhase()", async function () {
    //{Seed=0, General=1, Open=2}
    it("should revert if phase is not ahead of previous", async function () {
      await expect(ico.connect(deployer).setPhase(0)).to.be.revertedWith(
        "cant change phase backwards",
      );
    });
    it("should allow creator to set phase forward", async function () {
      await ico.connect(deployer).setPhase(1);
      result =  await ico.phase();
      expect(result.toString()).to.equal('1');
      await ico.connect(deployer).setPhase(2);
      result =  await ico.phase();
      expect(result.toString()).to.equal('2');
    });
    it("should revert if setter is not owner -setting true", async function () {
      await expect(ico.connect(whiteListed1).setPhase(2)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
    it("should revert if set invalid phase", async function () {
      await expect(ico.connect(whiteListed1).setPhase(3)).to.be.revertedWith(
        "Transaction reverted: function was called with incorrect parameters",
      );
    });
    it('emits event on setPhase Seed to General', async function () {
      await expect(ico.connect(deployer).setPhase(1))
      .to.emit(ico, 'PhaseUpdated')
      .withArgs('Seed', 'General')
    })
    it('emits event on setPhase Seed to Open', async function () {
      await expect(ico.connect(deployer).setPhase(2))
      .to.emit(ico, 'PhaseUpdated')
      .withArgs('Seed', 'Open')
    })
  });

  describe("getStringStatus()", async function () {
    //{Seed=0, General=1, Open=2}
    it("should return correct string status", async function () {
      result = await ico.connect(deployer).getStringStatus(0);
      expect(result.toString()).to.equal('Seed');
      result = await ico.connect(deployer).getStringStatus(1);
      expect(result.toString()).to.equal('General');
      result = await ico.connect(deployer).getStringStatus(2);
      expect(result.toString()).to.equal('Open');
      await expect(ico.connect(deployer).getStringStatus(3)).to.be.reverted;
    });
  });

  describe("buy()", async function () {

    describe("failure", async function () {
      it("should revert if paused", async function () {
        await ico.setPauseStatus(true);
        await expect(ico.connect(whiteListed1).buy({value: contribution1.toString()})).to.be.revertedWith("ico contributions paused")
      });
      it("should revert if in SeedPhase and not whitelisted", async function () {
        result =  await ico.phase();
        expect(result.toString()).to.equal('0');
        await expect(ico.connect(user3).buy({value: contribution2.toString()})).to.be.revertedWith("not whitelisted")
      });
      it("should revert if in SeedPhase and send more than limitSeed", async function () {
        result =  await ico.phase();
        expect(result.toString()).to.equal('0');
        await expect(ico.connect(whiteListed2).buy({value: excessContr.toString()})).to.be.revertedWith("contribution above limit")
      });
      it("should revert if in SeedPhase and contributor exceeds limit", async function () {
        result =  await ico.phase();
        expect(result.toString()).to.equal('0');
        await ico.connect(whiteListed1).buy({value: contribution1.toString()})
        await ico.connect(whiteListed1).buy({value: contribution1.toString()})
        await ico.connect(whiteListed1).buy({value: contribution1.toString()})
        result = await ico.contributions(whiteListed1.address)
        await expect(ico.connect(whiteListed1).buy({value: oneEther.toString()})).to.be.revertedWith("contribution above limit")
      });
      it("should revert if in GeneralPhase and send more than limitGeneral", async function () {
        await ico.setPhase(1);
        result = await ico.phase()
        expect(result.toString()).to.equal('1');
        await expect(ico.connect(whiteListed2).buy({value: excessContr.toString()})).to.be.revertedWith("contribution above limit")
      });
      it("should revert when phases change if whitelisted user exceed limitGeneral even if not exceeded limitSeed", async function () {
        result =  await ico.phase();
        expect(result.toString()).to.equal('0');
        await ico.connect(whiteListed1).buy({value: contribution1.toString()})
        await ico.connect(whiteListed1).buy({value: contribution3.toString()})
        result = await ico.contributions(whiteListed1.address)
        expect(result.toString()).to.equal('800000000000000000000') //less than the 1500 ETH
        // owner moves to General Phase
        await ico.connect(deployer).setPhase(1)
        //should fail as total for user = 1100 ETH which is above 1000ETH limit for General Phase 
        await expect(ico.connect(whiteListed1).buy({value: contribution3.toString()})).to.be.revertedWith("contribution above limit")
      });
      it("should revert if in GeneralPhase and send more than limitGeneral", async function () {
        await ico.setPhase(1);
        result = await ico.phase()
        expect(result.toString()).to.equal('1');
        await expect(ico.connect(whiteListed2).buy({value: excessContr.toString()})).to.be.revertedWith("contribution above limit")
      });
      
    });

    describe("success", async function () {
      it("should allow whitelisted user to buy in Seed Phase and update state variables", async function () {
        result =  await ico.phase();
        expect(result.toString()).to.equal('0');
        await ico.connect(whiteListed1).buy({value: contribution1.toString()})
        await ico.connect(whiteListed2).buy({value: contribution2.toString()})
        result = await ico.contributions(whiteListed1.address)
        expect(result.toString()).to.equal(contribution1.toString())
        result = await ico.contributions(whiteListed2.address)
        expect(result.toString()).to.equal(contribution2.toString())
        result = await ico.totalETHContributions()
        expect(result.toString()).to.equal(ethers.utils.parseEther('500.5').toString())
      });
      it('emits event on buy', async function () {
        await expect(ico.connect(whiteListed2).buy({value: oneEther.toString()}))
        .to.emit(ico, 'Buy')
        .withArgs(whiteListed2.address, oneEther.toString(), 0)
      })
      it("should allows whitelisted user to buy in all phases as long as not reached limits", async function () {
        await ico.connect(whiteListed1).buy({value: contribution1.toString()})
        await ico.connect(deployer).setPhase('1')
        await ico.connect(whiteListed1).buy({value: contribution1.toString()})
        await ico.connect(deployer).setPhase('2')
        await ico.connect(whiteListed1).buy({value: contribution1.toString()})
        result = await ico.contributions(whiteListed1.address)
        expect(result.toString()).to.equal(limitSeed.toString()) //500*3=1500
        result = await ico.totalETHContributions()
        expect(result.toString()).to.equal(limitSeed.toString())
      });
      it("should give refund if target 15K ETH is reached in SeedPhase", async function () {
        result = await ico.phase()
        expect(result.toString()).to.equal('0');
        for(let i=0; i<10; i++) {
          await ico.connect(deployer).setWhitelist(addresses[i].address, true);
          await ico.connect(addresses[i]).buy({value: limitSeed.toString()})
        }
        await ico.connect(deployer).setWhitelist(addresses[10].address, true);
        result = await ico.totalETHContributions()
        expect(result.toString()).to.equal(targetSeed.toString())
        // refund anyone tries above extra 
        result = await ico.total
        await expect(ico.connect(addresses[10]).buy({value: oneEther.toString()}))
        .to.emit(ico, 'Buy')
        .withArgs(addresses[10].address,oneEther.toString(), oneEther.toString())
      })
      it("should give refund if target 30K ETH is reached in GeneralPhase", async function () {
        result = await ico.phase()
        expect(result.toString()).to.equal('0');
        for(let i=0; i<10; i++) {
          await ico.connect(deployer).setWhitelist(addresses[i].address, true);
          await ico.connect(addresses[i]).buy({value: limitSeed.toString()})
        }
        result = await ico.totalETHContributions()
        // target 15K Seed Phase reached
        expect(result.toString()).to.equal(targetSeed.toString())
        //moves to GeneralPhase 
        await ico.connect(deployer).setPhase(1);
        result = await ico.phase()
        expect(result.toString()).to.equal('1');
        // generate another 10K in contributions 
        for(let i=10; i<20; i++) {
          await ico.connect(addresses[i]).buy({value: limitGeneral.toString()})
        }
        result = await ico.totalETHContributions()
        expect(result.toString()).to.equal('25000000000000000000000')
        // generate another 5K in contributions to reach limit (give them funds from treasury)
        let signer
        const randomPrivateKeys = ['bacf6601748fecf85cfaf003cf0d015b4ad968dd7391069aee4a0929bf4f870c',
          '5557d4365caf029ee05ae16aa36b65a152e7828e50e85f84338daf6751a50772',
          '1bbf6e6b227dcbe80cf3e3581deaa53a28adcafd4dde1991b8a1671d958105f4',
          'e01c70b452f0b7f5d79c5c829d55098e54cc0d4fccf2bbe05ee8ab98f1d76928',
          'eed4d558ba99850801f01748ddf6448a0976cce641578a698bcef8ce2e0ab1e8',
          '3d7ad5f63c0797bb4298e80c71a4f54f8a39307900cabb2ef61ef5993ae4bf99'
        ]
        for(let i=0; i<5; i++) {
          signer = new ethers.Wallet(randomPrivateKeys[i], provider);
          await addresses[i].sendTransaction({ //other addresses fund new accounts
            to: signer.address,
            value: limitSeed, 
          });
          await ico.connect(signer).buy({value: limitGeneral.toString()})
        }
        
        result = await ico.totalETHContributions()
        // target 30K in General Phase reached
        expect(result.toString()).to.equal(targetTotal.toString())
        // refund anyone tries above extra 
        walletRefunded = new ethers.Wallet(randomPrivateKeys[5], provider);
        await deployer.sendTransaction({
            to: walletRefunded.address,
            value: limitSeed, 
        });
        console.log(await provider.getBalance(walletRefunded.address))
        await expect(ico.connect(walletRefunded).buy({value: limitGeneral.toString()}))
        .to.emit(ico, 'Buy')
        .withArgs(walletRefunded.address, limitGeneral.toString(), limitGeneral.toString())
      })
    });
  });

  describe("claim()", async function () {
    it("should revert if not in Phase Open", async function () {
      await expect(ico.connect(whiteListed1).buy({value: contribution1.toString()}))
      await expect(ico.connect(whiteListed1).claim()).to.be.revertedWith("not in Open phase")
    });
    it("should revert if never contributed", async function () {
      await expect(ico.connect(whiteListed1).buy({value: contribution1.toString()}))
      await ico.connect(deployer).setPhase(2);
      await expect(ico.connect(whiteListed2).claim()).to.be.revertedWith("do not have funds")
    });
    it("should allow claim and adjust contributions user to zero and increase balance new tokens user", async function () {
      await ico.connect(deployer).setWhitelist(treasury.address, true)
      await ico.connect(treasury).buy({value: contribution1.toString()})
      await ico.connect(deployer).setPhase('1')
      await ico.connect(deployer).setPhase('2')
      result = await ico.contributions(treasury.address)
      expect(result.toString()).to.equal(contribution1.toString()) //500*3=1500
      result = await ico.totalETHContributions()
      expect(result.toString()).to.equal(contribution1.toString())
      // claims SPC tokens
      await ico.connect(treasury).claim()
      result = await ico.contributions(treasury.address)
      expect(result).to.equal(0)
      // check SPC balances credited 
      const SPCToken = await ICOFactory.attach(ico.address)
      const balanceSPC = await SPCToken.balanceOf(treasury.address) // must equal 500*5 = 2500 SPC coins
      expect(balanceSPC.toString()).to.equal(ethers.utils.parseEther('2500').toString())
    });
    it("should emit Claim event on claim", async function () {
      await ico.connect(deployer).setWhitelist(treasury.address, true)
      await ico.connect(treasury).buy({value: contribution1.toString()})
      await ico.connect(deployer).setPhase('1')
      await ico.connect(deployer).setPhase('2')
      // claims SPC tokens
      await expect(ico.connect(treasury).claim())
      .to.emit(ico, 'Claim')
      .withArgs(treasury.address, contribution1.toString(), ethers.utils.parseEther('2500').toString())
    })
  });

  describe("taxation on transfers", async function () {
    it("when not Taxable =>should act like a normal transfer for transfers()", async function () {
      await ico.connect(deployer).setTaxable(false);
      await ico.connect(deployer).setWhitelist(deployer.address,true);
      await ico.connect(deployer).buy({value: contribution1.toString()})
      await ico.connect(deployer).setPhase('1')
      await ico.connect(deployer).setPhase('2')
      //claims SPC tokens
      await expect(ico.connect(deployer).claim())
      // transfer SPC coins to other address
      await expect(ico.connect(deployer).transfer(user3.address, contribution1.toString()))
      .to.emit(ico, 'Transfer')
      .withArgs(deployer.address, user3.address, contribution1.toString())
      const balanceSPCTreasury = await ico.balanceOf(treasury.address) // must equal 0 no tax sent
      const balanceSPCUser = await ico.balanceOf(user3.address) // must equal 500 full amount SPC coins sent
      expect(balanceSPCTreasury).to.equal(0)
      expect(balanceSPCUser).to.equal(contribution1.toString())
    });
    it("when  Taxable =>should act like a normal transfer for transfers() with tax sent to treasury and lower amount sent", async function () {
      await ico.connect(deployer).setTaxable(true);
      await ico.connect(deployer).setWhitelist(deployer.address,true);
      await ico.connect(deployer).buy({value: contribution1.toString()})
      await ico.connect(deployer).setPhase('1')
      await ico.connect(deployer).setPhase('2')
      //claims SPC tokens
      await expect(ico.connect(deployer).claim())
      // calculations
      let taxAmount = 10 // 500 SPC sent * 2% tax rate
      let amountSent = 490 // 500 - 10
      taxAmount = ethers.utils.parseEther(taxAmount.toString())
      amountSent = ethers.utils.parseEther(amountSent.toString())
      // transfer SPC coins to other address
      await expect(ico.connect(deployer).transfer(user3.address, contribution1.toString()))
      .to.emit(ico, 'Transfer')
      .withArgs(deployer.address, user3.address, amountSent.toString())
      const balanceSPCTreasury = await ico.balanceOf(treasury.address) // must equal 10 tax sent
      const balanceSPCUser = await ico.balanceOf(user3.address) // must equal 500*5 = 2500 full amount SPC coins 
      expect(balanceSPCTreasury.toString()).to.equal(taxAmount)
      expect(balanceSPCUser.toString()).to.equal(amountSent)
    });
    // TO DO -. last test to check event sending Tax to treasury is emitted
  })
});
