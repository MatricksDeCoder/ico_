# Specifications

- Write your own ERC-20 token 
- Write an ICO contract
- 500,000 max total supply
- A 2% tax on every transfer that gets put into a treasury account
- A flag that toggles this tax on/off, controllable by owner, initialized to false

- The smart contract aims to raise 30,000 Ether by performing an ICO. 
- The ICO should only be available to whitelisted private investors starting in Phase Seed with a maximum total private contribution limit of 15,000 Ether and an individual contribution limit of 1,500 Ether.
- The ICO should only be available to whitelisted private investors starting in Phase Seed with a maximum total private contribution limit of 15,000 Ether and an individual contribution limit of 1,500 Ether.
- During this phase, the individual contribution limit should be 1,000 Ether, until Phase Open, at which point the individual contribution limit should be removed. 
- At that point, the ICO contract should immediately release ERC20-compatible tokens for all contributors at an exchange rate of 5 tokens to 1 Ether. 
- The owner of the contract should have the ability to pause and resume fundraising at any time, as well as move a phase forwards (but not backwards) at will.

- ## Assumptions 

- Owner can move from Seed Phase to Open Phase directly to speed up contributions
- Limits preserved in each phase if contributor put 1000 in Seed Phase they have already reached limit General so cant contribute
- 300000 ETH is a hrd limit, First contributor to go above 300000 will be refunded excess amount! After that when target reached contributions are not allowed
- Contributors cant claim SPC in parts; they can only claim the whole amounts
- Contributors can only claim SPC in Open Phase even if target ETH 30K raised in earlier phases, so owner will have to manually move Phase to Open to allow claiming of SPC
- Withdrawal of contributions function commented out as not specified in specs so not sure if funds stay in account, go to treasury, are moved by owner, treasury or other admin role
- Tax reduces the amount sent by sender. Tax is also treated like a normal transfer so will also emit Transfer Event 

- ## Security 

Slither Results
- raises Reentrancy problem in ico.buy() however not a problem as user will just contribute tokens, addition CEI pattern used
- CEI (Checks Effects Interactions)

- ## Design.md 
"The base requirements give contributors their SPC tokens immediately. How would you design your contract to vest the awarded tokens instead, i.e. award tokens to users over time, linearly?"

- can using a lockign mechanism that keep track of time since start to decided end by checking blocks and releasing percentage of tokens base on a scale that ensures all tokens released at end date


# Solidity Template

My favorite setup for writing Solidity smart contracts.

- [Hardhat](https://github.com/nomiclabs/hardhat): compile and run the smart contracts on a local development network
- [TypeChain](https://github.com/ethereum-ts/TypeChain): generate TypeScript types for smart contracts
- [Ethers](https://github.com/ethers-io/ethers.js/): renowned Ethereum library and wallet implementation
- [Waffle](https://github.com/EthWorks/Waffle): tooling for writing comprehensive smart contract tests
- [Solhint](https://github.com/protofire/solhint): linter
- [Solcover](https://github.com/sc-forks/solidity-coverage): code coverage
- [Prettier Plugin Solidity](https://github.com/prettier-solidity/prettier-plugin-solidity): code formatter

This is a GitHub template, which means you can reuse it as many times as you want. You can do that by clicking the "Use this
template" button at the top of the page.

## Usage

### Pre Requisites

Before running any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an environment
variable. Follow the example in `.env.example`. If you don't already have a mnemonic, use this [website](https://iancoleman.io/bip39/) to generate one.

Then, proceed with installing dependencies:

```sh
yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```sh
$ yarn typechain
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Test

Run the Mocha tests:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true yarn test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

### Deploy

Deploy the contracts to Hardhat Network:

```sh
$ yarn deploy --greeting "Bonjour, le monde!"
```

## Syntax Highlighting

If you use VSCode, you can enjoy syntax highlighting for your Solidity code via the
[vscode-solidity](https://github.com/juanfranblanco/vscode-solidity) extension. The recommended approach to set the
compiler version is to add the following fields to your VSCode user settings:

```json
{
  "solidity.compileUsingRemoteVersion": "v0.8.4+commit.c7e474f2",
  "solidity.defaultCompiler": "remote"
}
```

Where of course `v0.8.4+commit.c7e474f2` can be replaced with any other version.
