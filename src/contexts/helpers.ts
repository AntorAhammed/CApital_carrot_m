
import { web3 } from '@project-serum/anchor';
import {
  Keypair,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  ConfirmOptions,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';

// for rest function
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token, MintLayout } from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';
import * as borsh from 'borsh';
import { METADATA_SCHEMA, Metadata } from './processMetaplexAccounts';


const MAX_ITEM_COUNT = 15;

const IDL = require('./anchor_idl/idl/spin_win');

const PROGRAM_ID = new PublicKey(
  "G2roHNqPvkVz4hko9Ha8443QrFUGg5YFkLDqW7Cyt1LK"
);
const initAdminKey = new PublicKey("D36zdpeXt7Agaatt97MiX9kWqwbjyVhMFoZBN2oMvQmZ");

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);


let program: any = null;
let provider: any = null;
let poolAccountPDA: any = null;
let poolVaultPDA: any = null;

// pool associated account for pay : FPVK44CD6Asb951kUinP9DxopwgWEhopPtZm7oq1hpsZ
// pool associated account for reward : 9K1tmvtnvU45eFA7Lvey1C6S6dF4p1MGA63GTsQo8Eqq

// pay account : 6BGK3LfHHc5tzVo6ixKPba8f16fNZCckX1ZQZhJJ8NtT
const PAY_TOKEN = '5HkxgJ2JPtTTGJZ4r2HAETpNtkotWirte7CXQ32qyELS';
const payMint = new PublicKey(PAY_TOKEN);

const REWARD_TOKEN = 'FNY5Bb9bsYc2cJCrXt28WtjqgxFbEk5Gsc4cvHzUtHXd';
const rewardMint = new PublicKey(REWARD_TOKEN);

// test
let mintA: Token;
const mintAuthority = anchor.web3.Keypair.generate();
const payer = anchor.web3.Keypair.generate();

const createAssociatedTokenAccountInstruction = (
  associatedTokenAddress: anchor.web3.PublicKey,
  payer: anchor.web3.PublicKey,
  walletAddress: anchor.web3.PublicKey,
  splTokenMintAddress: anchor.web3.PublicKey
) => {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
    { pubkey: walletAddress, isSigner: false, isWritable: false },
    { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
    {
      pubkey: anchor.web3.SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    {
      pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new anchor.web3.TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([]),
  });
};

const getTokenWallet = async (
  wallet: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey
) => {
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )[0];
};

const testDeposit = async (wallet: any, connection: any) => {
  await connection.confirmTransaction(
    await connection.requestAirdrop(payer.publicKey, 1000000000),
    "processed"
  );

  mintA = await Token.createMint(
    provider.connection,
    payer,
    mintAuthority.publicKey,
    null,
    0,
    TOKEN_PROGRAM_ID
  );

  var myToken = new Token(
    connection,
    mintA.publicKey,
    TOKEN_PROGRAM_ID,
    payer
  );
  // Token.getAssociatedTokenAddress()
  var assAccount = await getTokenWallet(poolAccountPDA, mintA.publicKey);
  if ((await connection.getAccountInfo(assAccount)) == null) {
    await provider.send(
      (() => {
        let transaction = new Transaction();
        transaction.add(
          createAssociatedTokenAccountInstruction(
            assAccount,
            wallet.publicKey,
            poolAccountPDA,
            mintA.publicKey
          )
        );
        return transaction;
      })(),
      []
    );
  }

  await mintA.mintTo(
    assAccount,
    mintAuthority.publicKey,
    [mintAuthority],
    100
  );

  let tokenAmount = await provider.connection.getTokenAccountBalance(assAccount);
}

export const initialize = async (wallet: any, connection: any) => {
  let cloneWindow: any = window;
  provider = new anchor.Provider(connection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  program = new anchor.Program(IDL, PROGRAM_ID, provider);

  const [_pool, _bump] = await PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("sw_game_vault_auth"))], program.programId);

  // let randomPubkey = Keypair.generate().publicKey;
  // let [_pool, _bump] = await PublicKey.findProgramAddress(
  //   [randomPubkey.toBuffer()],
  //   program.programId
  // );

  poolVaultPDA = _pool;

  let poolAccountSeed = "spin-wheel-pool";
  poolAccountPDA = await PublicKey.createWithSeed(
    initAdminKey, // 
    poolAccountSeed,
    program.programId,
  );

  if ((await connection.getAccountInfo(poolAccountPDA)) == null) {
    console.log('initialize start...');

    let transaction = new Transaction();

    let POOL_SPACE = 4975;
    transaction.add(SystemProgram.createAccountWithSeed({
      fromPubkey: wallet.publicKey,
      basePubkey: wallet.publicKey,
      seed: poolAccountSeed,
      newAccountPubkey: poolAccountPDA,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(POOL_SPACE),
      space: POOL_SPACE,
      programId: program.programId,
    }));

    transaction.add(
      program.instruction.initialize(
        _bump,
        {
          accounts: {
            initializer: wallet.publicKey,
            pool: poolVaultPDA,
            state: poolAccountPDA,
            systemProgram: SystemProgram.programId,
          },
        }
      )
    );

    await wallet.sendTransaction(transaction, connection);
  }

  return true;
}

const convertToPubKey = (pubKeyStrList: []) => {
  let pkList = [];
  for (let i = 0; i < pubKeyStrList.length; i++) {
    pkList.push(new PublicKey(pubKeyStrList[i]));
  }

  return pkList;
}

export const setItemInfos = async (wallet: any, connection: any, itemInfos: []) => {
  console.log('Start to Set Item...');

  let token_addr_list = [];
  let token_type_list = [];
  let ratio_list = [];
  let amount_list = [];
  for (let i = 0; i < MAX_ITEM_COUNT; i++) {
    if (i < itemInfos.length) {
      token_addr_list.push(convertToPubKey(itemInfos[i]["tokenAddrList"]));
      token_type_list.push(Number(itemInfos[i]["tokenType"]));
      ratio_list.push(Number(itemInfos[i]["winningPercentage"]));
      amount_list.push(new anchor.BN(itemInfos[i]["price"]));
    } else {
      token_addr_list.push([]);
      token_type_list.push(0);
      ratio_list.push(0);
      amount_list.push(new anchor.BN(0));
    }
  }

  console.log('token addrs', token_addr_list);
  console.log('ratios', ratio_list);
  console.log('amounts', amount_list);

  for (let i = 0; i < MAX_ITEM_COUNT; i += 2) {
    let transaction = new Transaction();
    for (let k = 0; k < 2; k++) {
      let item_idx = i + k;
      if (item_idx >= MAX_ITEM_COUNT) {
        break;
      }

      transaction.add(
        program.instruction.setItem(
          item_idx,
          token_addr_list[item_idx],
          token_addr_list[item_idx].length,
          token_type_list[item_idx],
          ratio_list[item_idx],
          amount_list[item_idx],
          {
            accounts: {
              state: poolAccountPDA,
            },
            // signers: [wallet]
          }
        )
      );
    }
    await wallet.sendTransaction(transaction, connection);
  }

  console.log('End to Set Item...');

  return true;
}

const getIdFromName = (name: string): number => {
  //"WolfHero #11"
  // "Seat #8"
  let len = name.length;
  let sharp = name.search('#');
  return parseInt(name.substring(sharp + 1, len)) - 1;
}


const METADATA_REPLACE = new RegExp("\u0000", "g");
function decodeMetadata(buffer: any) {
  const metadata = borsh.deserializeUnchecked(
    METADATA_SCHEMA,
    Metadata,
    buffer
  );

  metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, "");
  metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, "");
  metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, "");
  return metadata;
}

export const getNFTs = async (connection: any, nftAddr: PublicKey) => {

  const metadataAccount = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        nftAddr.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )
  )[0];

  let accInfo = await connection.getAccountInfo(metadataAccount);

  let nftAttr = decodeMetadata(accInfo.data);
  console.log("nft Name =", nftAttr.data.name);
  console.log("nft Id =", getIdFromName(nftAttr.data.name));
  console.log('nftAttr Data', nftAttr);

  return nftAttr.data;
}

export const getItemInfos = async (connection: any) => {
  if (poolAccountPDA == false) {
    return null;
  }

  try {
    let _state = await program.account.spinItemList.fetch(
      poolAccountPDA
    );

    return _state;
  } catch (error) {
    console.log('getItemInfos error : ', error);
    return null;
  }
}


export const transferFromWalletToContract = async (wallet: any, connection: any, transaction: Transaction, payMethodToken: any, mintWC: any, payAmount: any) => {
  console.log('Start to transfer from wallet to contract...');

  if (payMethodToken) {
    var myToken = new Token(
      connection,
      mintWC,
      TOKEN_PROGRAM_ID,
      wallet
    );
    let mintInfo = await myToken.getMintInfo();
    console.log('=========== mintInfo ==========', mintInfo);
    var sourcePayAccount = null;
    try {
      sourcePayAccount = await myToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);
      if ((await connection.getAccountInfo(sourcePayAccount.address)) == null) {
        console.log('Zero balance');
        return false;
      }
    } catch (error) {
      console.log('Cannot find payment tokens in your wallet');
      return false;
    }

    var destPayAccount = await getTokenWallet(poolAccountPDA, mintWC);
    // var destPayAccount = await myToken.getOrCreateAssociatedAccountInfo(poolAccountPDA.publicKey);

    if ((await connection.getAccountInfo(destPayAccount)) == null) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          destPayAccount,
          wallet.publicKey,
          poolAccountPDA,
          mintWC
        )
      );
    }

    let srcAmount = await provider.connection.getTokenAccountBalance(sourcePayAccount.address);
    console.log('pay balances : ', srcAmount, payAmount * (10 ** mintInfo.decimals));
    if (srcAmount < payAmount) {
      console.log('Infucient balance : ', srcAmount, payAmount);
      return false;
    }

    transaction.add(
      Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        sourcePayAccount.address,
        destPayAccount,
        wallet.publicKey,
        [],
        payAmount * (10 ** mintInfo.decimals),
      )
    );
  } else {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: poolAccountPDA,
        lamports: (payAmount * web3.LAMPORTS_PER_SOL),
      })
    );
  }

  console.log('End to transfer from wallet to contract...');

  return true;
}


export const doSpinEngine = async (wallet: any, connection: any, transaction: Transaction) => {
  console.log('Start to spin_wheel...');
  // transaction.add(
  //   program.instruction.spinWheel({
  //     accounts: {
  //       state: poolAccountPDA,
  //     }
  //   })
  // );

  await program.rpc.spinWheel({
    accounts: {
      state: poolAccountPDA,
    }
  });
  let _state = await program.account.spinItemList.fetch(
    poolAccountPDA
  );

  let spin_res = _state.lastSpinindex + 1;
  let msg = "You could win " + spin_res + " item. ";
  if (_state.lastSpinindex % 2 == 0) {
    msg += "Collect your reward tokens on website.";
    // msg += "YOU HAVE WON THE NFT. You can claim it on website.";
  } else {
    msg += "Collect your reward tokens on website.";
  }

  console.log('pool data', _state);
  let rMintList = _state.rewardMintList[_state.lastSpinindex];
  let amount = _state.amountList[_state.lastSpinindex].toNumber();
  // console.log('reward mint list', rMintList);

  for (let i = 0; i < rMintList.count; i++) {
    await claimRewards(wallet, connection, transaction, rMintList.itemMintList[i], amount);
  }

  try {
    await wallet.sendTransaction(transaction, connection);
    console.log("SUCCESS");

  } catch (error) {
    console.log('rejected error : ', error);
    return -1;
  }

  console.log('End to spin_wheel...');

  return _state.lastSpinindex;
}

export const spinWheel = async (wallet: any, connection: any) => {
  let transaction = new Transaction();

  // if (await initialize(wallet, connection, transaction) == false) {
  //   return false;
  // }

  if (await transferFromWalletToContract(wallet, connection, transaction, true, payMint, 0.1) == false) {
    return -1;
  }


  return await doSpinEngine(wallet, connection, transaction);
}

export const deposit = async (wallet: any, connection: any, mintA: any, amount: any) => {
  var myToken = new Token(
    connection,
    mintA,
    TOKEN_PROGRAM_ID,
    wallet
  );

  let _state = await program.account.spinItemList.fetch(
    poolAccountPDA
  );

  let mintInfo = await myToken.getMintInfo();
  var sourceAccount = await myToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);
  var destAccount = await myToken.getOrCreateAssociatedAccountInfo(_state.escrowAccount);

  let bnAmount = amount * (10 ** mintInfo.decimals);
  let tokenAmount = await provider.connection.getTokenAccountBalance(sourceAccount.address);

  await myToken.transfer(
    sourceAccount.address,
    destAccount.address,
    wallet.publicKey,
    [wallet],
    new anchor.BN(bnAmount),
  );
}

export const claimRewards = async (wallet: any, connection: any, transaction: Transaction, rMint: any, amount: any) => {
  console.log('start to claim rewards.');

  var myToken = new Token(
    connection,
    rMint,
    TOKEN_PROGRAM_ID,
    payer
  );

  let mintInfo = await myToken.getMintInfo();
  var sourceAccount = await getTokenWallet(poolVaultPDA, rMint);

  // console.log('==========', poolVaultPDA.toBase58(), rMint.toBase58());

  var destAccount = await getTokenWallet(wallet.publicKey, rMint);
  if ((await connection.getAccountInfo(destAccount)) == null) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        destAccount,
        wallet.publicKey,
        wallet.publicKey,
        rMint
      )
    );
  }

  // let tokenAmount = await provider.connection.getTokenAccountBalance(destAccount);

  let bnAmount = amount * (10 ** mintInfo.decimals);

  transaction.add(
    program.instruction.claim(
      new anchor.BN(bnAmount),
      {
        accounts: {
          owner: wallet.publicKey,
          state: poolAccountPDA,
          pool: poolVaultPDA,
          sourceRewardAccount: sourceAccount,
          destRewardAccount: destAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      })
  );

  // tokenAmount = await provider.connection.getTokenAccountBalance(destAccount.address);

  console.log('end to claim rewards.');
}

export const setAdminInfos = async (wallet: any, connection: any, itemInfos: []) => {
  console.log('start admin');
  try {
    await initialize(wallet, connection);
  } catch (error) {
    console.log('admin initialize error', error);
    return false;
  }

  if (await setItemInfos(wallet, connection, itemInfos) == false) {
    console.log('admin failed');

    return -1;
  }

  console.log('end admin');

  return true;
}